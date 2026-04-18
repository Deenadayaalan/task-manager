// src/config/aws-config.js
const awsConfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    mandatorySignIn: true,
    cookieStorage: {
      domain: process.env.REACT_APP_COOKIE_DOMAIN || 'localhost',
      path: '/',
      expires: 365,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    },
    authenticationFlowType: 'USER_SRP_AUTH',
    oauth: {
      domain: process.env.REACT_APP_OAUTH_DOMAIN,
      scope: ['email', 'profile', 'openid'],
      redirectSignIn: process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3000/',
      redirectSignOut: process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
      responseType: 'code'
    }
  },
  API: {
    endpoints: [
      {
        name: 'TaskManagerAPI',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
      }
    ]
  }
};

export default awsConfig;