import { Amplify } from 'aws-amplify';

let _configured = false;

/** Safe to call multiple times — configures Amplify once per browser session. */
export function configureAmplify() {
  if (_configured || typeof window === 'undefined') return;
  _configured = true;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '',
            scopes: ['openid', 'profile', 'email'],
            redirectSignIn: [`${window.location.origin}/`],
            redirectSignOut: [`${window.location.origin}/`],
            responseType: 'code',
          },
        },
      },
    },
  });
}
