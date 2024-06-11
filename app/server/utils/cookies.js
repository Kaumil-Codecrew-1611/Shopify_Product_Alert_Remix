import { createCookie } from '@remix-run/node';

export const accessTokenCookie = createCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
});
export async function setAccessTokenCookie(request, accessToken) {
    // Check if the accessToken cookie already exists
    const existingAccessToken = await getAccessTokenFromRequest(request);
    if (existingAccessToken) {
        return;
    }

    // Set the new access token cookie
    const cookieHeader = await accessTokenCookie.serialize(accessToken);
    return new Response('Access token set in cookie', {
        headers: {
            'Set-Cookie': cookieHeader,
        },
    });
}

export async function getAccessTokenFromRequest(request) {
    const cookieHeader = request.headers.get('Cookie');
    return await accessTokenCookie.parse(cookieHeader);
}

