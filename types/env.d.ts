declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    MONGODB_URI: string;
    MONGODB_DB?: string;

    // NextAuth
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;

    // Razorpay
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;

    // Node
    NODE_ENV: 'development' | 'production' | 'test';
  }
}