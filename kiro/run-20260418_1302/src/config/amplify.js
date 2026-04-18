// src/config/amplify.js
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
      identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: process.env.REACT_APP_COGNITO_DOMAIN,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            'http://localhost:3000/auth/callback',
            `https://${process.env.REACT_APP_DOMAIN}/auth/callback`
          ],
          redirectSignOut: [
            'http://localhost:3000/auth/logout',
            `https://${process.env.REACT_APP_DOMAIN}/auth/logout`
          ],
          responseType: 'code'
        },
        email: true,
        username: false
      }
    }
  },
  API: {
    REST: {
      TaskManagerAPI: {
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION
      }
    }
  }
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;