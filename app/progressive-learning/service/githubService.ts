// GitHub Integration Service for Progressive Learning System

interface GitHubConfig {
    owner: string;
    repo: string;
    token: string;
    branch: string;
}

export interface LearningDocument {
    id: string;
    userId: string;
    domain: string;
    level: string;
    scenarioId: string;
    timestamp: string;
    scenario: {
        title: string;
        content: string;
        difficulty: number;
    };
    userResponse: string;
    aiFeedback: {
        score: number;
        strengths: string[];
        improvements: string[];
        nextFocus: string;
    };
    sessionContext: {
        previousScenarios: number;
        overallProgress: number;
        skillProgression: Record<string, number>;
    };
}

export class GitHubLearningService {
    private config: GitHubConfig;

    constructor(config: GitHubConfig) {
        this.config = config;
    }

    /**
     * Store a learning session document in GitHub repo
     */
    async storeLearningDocument(document: LearningDocument): Promise<boolean> {
        try {
            const fileName = `learning-sessions/${document.domain}/${document.level}/${document.userId}/${document.id}.md`;
            const markdownContent = this.generateMarkdown(document);
            
            // Check if file exists
            const existingFile = await this.getFileFromGitHub(fileName);
            
            const payload = {
                message: `Add learning session: ${document.scenario.title}`,
                content: btoa(markdownContent), // Base64 encode
                branch: this.config.branch,
                ...(existingFile && { sha: existingFile.sha }) // Include SHA if updating
            };

            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fileName}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Error storing learning document:', error);
            return false;
        }
    }

    /**
     * Retrieve learning history for a user
     */
    async getUserLearningHistory(userId: string, domain?: string, level?: string): Promise<LearningDocument[]> {
        try {
            const basePath = `learning-sessions${domain ? `/${domain}` : ''}${level ? `/${level}` : ''}/${userId}`;
            const files = await this.getDirectoryContents(basePath);
            
            const documents: LearningDocument[] = [];
            
            for (const file of files) {
                if (file.type === 'file' && file.name.endsWith('.md')) {
                    const content = await this.getFileContent(file.path);
                    const document = this.parseMarkdownToDocument(content);
                    if (document) {
                        documents.push(document);
                    }
                }
            }
            
            // Sort by timestamp
            return documents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        } catch (error) {
            console.error('Error retrieving learning history:', error);
            return [];
        }
    }

    /**
     * Get scenario templates from GitHub repo
     */
    async getScenarioTemplates(domain: string, level: string): Promise<any[]> {
        try {
            const path = `scenario-templates/${domain}/${level}`;
            const files = await this.getDirectoryContents(path);
            
            const templates = [];
            for (const file of files) {
                if (file.type === 'file' && file.name.endsWith('.json')) {
                    const content = await this.getFileContent(file.path);
                    try {
                        const template = JSON.parse(content);
                        templates.push(template);
                    } catch (parseError) {
                        console.warn('Failed to parse template:', file.name);
                    }
                }
            }
            
            return templates;
        } catch (error) {
            console.error('Error retrieving scenario templates:', error);
            return [];
        }
    }

    /**
     * Store scenario template in GitHub
     */
    async storeScenarioTemplate(domain: string, level: string, template: any): Promise<boolean> {
        try {
            const fileName = `scenario-templates/${domain}/${level}/${template.id}.json`;
            const jsonContent = JSON.stringify(template, null, 2);
            
            const payload = {
                message: `Add scenario template: ${template.title}`,
                content: btoa(jsonContent),
                branch: this.config.branch
            };

            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fileName}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Error storing scenario template:', error);
            return false;
        }
    }

    /**
     * Get analytics data from stored learning sessions
     */
    async getLearningAnalytics(domain?: string, level?: string): Promise<any> {
        try {
            const basePath = `learning-sessions${domain ? `/${domain}` : ''}${level ? `/${level}` : ''}`;
            const allFiles = await this.getAllFilesRecursively(basePath);
            
            const analytics = {
                totalSessions: 0,
                averageScore: 0,
                completionRate: 0,
                commonStrengths: {} as Record<string, number>,
                commonWeaknesses: {} as Record<string, number>,
                progressionTrends: [] as any[],
                domainDistribution: {} as Record<string, number>,
                levelDistribution: {} as Record<string, number>
            };

            const documents: LearningDocument[] = [];
            
            for (const file of allFiles) {
                if (file.name.endsWith('.md')) {
                    const content = await this.getFileContent(file.path);
                    const document = this.parseMarkdownToDocument(content);
                    if (document) {
                        documents.push(document);
                    }
                }
            }

            // Calculate analytics
            analytics.totalSessions = documents.length;
            
            if (documents.length > 0) {
                const totalScore = documents.reduce((sum, doc) => sum + doc.aiFeedback.score, 0);
                analytics.averageScore = Math.round(totalScore / documents.length);

                // Count strengths and weaknesses
                documents.forEach(doc => {
                    doc.aiFeedback.strengths.forEach(strength => {
                        analytics.commonStrengths[strength] = (analytics.commonStrengths[strength] || 0) + 1;
                    });
                    
                    doc.aiFeedback.improvements.forEach(weakness => {
                        analytics.commonWeaknesses[weakness] = (analytics.commonWeaknesses[weakness] || 0) + 1;
                    });

                    // Domain and level distribution
                    analytics.domainDistribution[doc.domain] = (analytics.domainDistribution[doc.domain] || 0) + 1;
                    analytics.levelDistribution[doc.level] = (analytics.levelDistribution[doc.level] || 0) + 1;
                });
            }

            return analytics;
        } catch (error) {
            console.error('Error generating analytics:', error);
            return null;
        }
    }

    // Private helper methods

    private async getFileFromGitHub(path: string): Promise<any> {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                    }
                }
            );
            
            return response.ok ? await response.json() : null;
        } catch (error) {
            return null;
        }
    }

    private async getDirectoryContents(path: string): Promise<any[]> {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                    }
                }
            );
            
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('Error getting directory contents:', error);
            return [];
        }
    }

    private async getFileContent(path: string): Promise<string> {
        try {
            const file = await this.getFileFromGitHub(path);
            return file ? atob(file.content) : '';
        } catch (error) {
            console.error('Error getting file content:', error);
            return '';
        }
    }

    private async getAllFilesRecursively(path: string): Promise<any[]> {
        const allFiles: any[] = [];
        
        const processDirectory = async (dirPath: string) => {
            const contents = await this.getDirectoryContents(dirPath);
            
            for (const item of contents) {
                if (item.type === 'file') {
                    allFiles.push(item);
                } else if (item.type === 'dir') {
                    await processDirectory(item.path);
                }
            }
        };
        
        await processDirectory(path);
        return allFiles;
    }

    private generateMarkdown(document: LearningDocument): string {
        return `# Learning Session: ${document.scenario.title}

## Session Metadata
- **ID:** ${document.id}
- **User ID:** ${document.userId}
- **Domain:** ${document.domain}
- **Level:** ${document.level}
- **Timestamp:** ${document.timestamp}
- **Scenario ID:** ${document.scenarioId}

## Scenario Details
- **Title:** ${document.scenario.title}
- **Difficulty:** ${document.scenario.difficulty}/10

### Scenario Content
${document.scenario.content}

## User Response
${document.userResponse}

## AI Feedback

### Score: ${document.aiFeedback.score}/100

### Strengths
${document.aiFeedback.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${document.aiFeedback.improvements.map(i => `- ${i}`).join('\n')}

### Next Focus
${document.aiFeedback.nextFocus}

## Session Context
- **Previous Scenarios:** ${document.sessionContext.previousScenarios}
- **Overall Progress:** ${document.sessionContext.overallProgress}%

### Skill Progression
${Object.entries(document.sessionContext.skillProgression)
    .map(([skill, level]) => `- **${skill}:** ${level}/10`)
    .join('\n')}

---
*Generated by FutureFlex Progressive Learning System*
`;
    }

    private parseMarkdownToDocument(markdown: string): LearningDocument | null {
        try {
            // Basic parsing - in a real implementation, use a proper markdown parser
            const lines = markdown.split('\n');
            const document: Partial<LearningDocument> = {};
            
            // Extract metadata using regex
            const extractValue = (pattern: string) => {
                const line = lines.find(l => l.includes(pattern));
                return line ? line.split(':')[1]?.trim() : '';
            };
            
            document.id = extractValue('**ID:**');
            document.userId = extractValue('**User ID:**');
            document.domain = extractValue('**Domain:**');
            document.level = extractValue('**Level:**');
            document.timestamp = extractValue('**Timestamp:**');
            document.scenarioId = extractValue('**Scenario ID:**');
            
            // Extract score
            const scoreMatch = markdown.match(/### Score: (\d+)\/100/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            
            // This is a simplified parser - a full implementation would be more robust
            if (document.id && document.userId) {
                return document as LearningDocument;
            }
            
            return null;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            return null;
        }
    }
}

// Default configuration (will be overridden by environment variables)
export const createGitHubService = (customConfig?: Partial<GitHubConfig>): GitHubLearningService => {
    const defaultConfig: GitHubConfig = {
        owner: process.env.GITHUB_OWNER || 'your-username',
        repo: process.env.GITHUB_REPO || 'futureflex-learning-data',
        token: process.env.GITHUB_TOKEN || '',
        branch: process.env.GITHUB_BRANCH || 'main'
    };
    
    return new GitHubLearningService({ ...defaultConfig, ...customConfig });
};

// Browser-compatible version using localStorage as fallback
export class LocalStorageLearningService {
    private storageKey = 'futureflex_learning_data';

    async storeLearningDocument(document: LearningDocument): Promise<boolean> {
        try {
            const existingData = this.getData();
            existingData.documents.push(document);
            existingData.lastUpdated = new Date().toISOString();
            
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            return true;
        } catch (error) {
            console.error('Error storing learning document locally:', error);
            return false;
        }
    }

    async getUserLearningHistory(userId: string, domain?: string, level?: string): Promise<LearningDocument[]> {
        try {
            const data = this.getData();
            return data.documents
                .filter(doc => 
                    doc.userId === userId &&
                    (!domain || doc.domain === domain) &&
                    (!level || doc.level === level)
                )
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        } catch (error) {
            console.error('Error retrieving learning history:', error);
            return [];
        }
    }

    async getLearningAnalytics(domain?: string, level?: string): Promise<any> {
        try {
            const data = this.getData();
            const filteredDocs = data.documents.filter(doc =>
                (!domain || doc.domain === domain) &&
                (!level || doc.level === level)
            );

            const analytics = {
                totalSessions: filteredDocs.length,
                averageScore: 0,
                commonStrengths: {} as Record<string, number>,
                commonWeaknesses: {} as Record<string, number>,
                domainDistribution: {} as Record<string, number>,
                levelDistribution: {} as Record<string, number>,
                lastUpdated: data.lastUpdated
            };

            if (filteredDocs.length > 0) {
                const totalScore = filteredDocs.reduce((sum, doc) => sum + doc.aiFeedback.score, 0);
                analytics.averageScore = Math.round(totalScore / filteredDocs.length);

                filteredDocs.forEach(doc => {
                    doc.aiFeedback.strengths.forEach(strength => {
                        analytics.commonStrengths[strength] = (analytics.commonStrengths[strength] || 0) + 1;
                    });
                    
                    doc.aiFeedback.improvements.forEach(improvement => {
                        analytics.commonWeaknesses[improvement] = (analytics.commonWeaknesses[improvement] || 0) + 1;
                    });

                    analytics.domainDistribution[doc.domain] = (analytics.domainDistribution[doc.domain] || 0) + 1;
                    analytics.levelDistribution[doc.level] = (analytics.levelDistribution[doc.level] || 0) + 1;
                });
            }

            return analytics;
        } catch (error) {
            console.error('Error generating analytics:', error);
            return null;
        }
    }

    private getData(): { documents: LearningDocument[], lastUpdated: string } {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : { documents: [], lastUpdated: new Date().toISOString() };
        } catch (error) {
            return { documents: [], lastUpdated: new Date().toISOString() };
        }
    }

    exportData(): string {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

export const localStorageService = new LocalStorageLearningService();
