import NextErrorComponent from 'next/error';

const reportError = async (err: Error, asPath: string, isServer: boolean, req?: any) => {
  try {
    let url = '/api/dev-errors';
    if (isServer && req) {
      const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
      url = `${protocol}://${req.headers.host}/api/dev-errors`;
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'Frontend',
        errorMessage: err.message || 'Next.js Fatal Error',
        errorStack: err.stack,
        url: asPath,
        context: { isServer }
      })
    });
  } catch (e) {
    console.error('Failed to report error to discord', e);
  }
};

const MyError = ({ statusCode, hasGetInitialPropsRun, err }: any) => {
  if (!hasGetInitialPropsRun && err) {
    reportError(err, 'Client Render Error', false);
  }
  return <NextErrorComponent statusCode={statusCode} />;
};

MyError.getInitialProps = async (context: any) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(context);
  const { res, err, asPath } = context;

  (errorInitialProps as any).hasGetInitialPropsRun = true;

  if (err) {
    const isServer = !!res;
    if (res?.statusCode !== 404) {
        try {
            await reportError(err, asPath, isServer, context.req);
        } catch (reportErr) {}
    }
    return errorInitialProps;
  }

  return errorInitialProps;
};

export default MyError;
