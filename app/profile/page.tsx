import { cookies } from 'next/headers';
import Image from 'next/image';
interface User {
    name: string;
    email: string;
    avatar: string;
    role: string;
    createdAt: string;
}

interface ProfileResponse {
    status: string;
    data: User;
}

export default async function ProfilePage() {
    const cookieStore = cookies();
    const rawToken = (await cookieStore).get('auth_token')?.value;

    let token: string | undefined;
    if (rawToken?.startsWith('j:')) {
        try {
            token = JSON.parse(rawToken.slice(2)).access_token;
        } catch (err) {
            console.error('Failed to parse token:', err);
        }
    } else {
        token = rawToken;
    }


    if (!token) {
        return <div className="text-red-500">No token found. Please login.</div>;
    }
    console.log('Token:', token);
    const response = await fetch('http://localhost:3000/api/user/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        // Don't use credentials: 'include' in server-side fetch — it's for browser fetch.
    });

    if (!response.ok) {
        return <div className="text-red-500">Failed to fetch profile. Status: {response.status}</div>;
    }

    const data: ProfileResponse = await response.json();
    const user: User = data.data;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
            <div className="flex items-center space-x-4 mb-6">
                <Image
                    src={user.avatar}
                    alt={user.name}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                    priority
                />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                    <p className="text-gray-600">{user.email}</p>
                </div>
            </div>

            <div className="space-y-4">

                <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">Role:</span>
                    <span className="text-gray-600 capitalize">{user.role}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-semibold text-gray-700">Member Since:</span>
                    <span className="text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="mt-6 flex space-x-4">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Back to Home
                </button>
                <button

                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
