const fs = require('fs');

const files = [
    'pages/admin/index.tsx',
    'pages/api/admin/bookings.ts',
    'pages/api/admin/comedians.ts',
    'pages/api/admin/payments.ts',
    'pages/api/admin/cms/content.ts',
    'pages/api/admin/cms/revalidate.ts',
    'pages/api/admin/cms/upload.ts',
    'pages/api/admin/users/[id].ts',
    'pages/api/admin/cms/content/[id].ts',
    'pages/api/admin/comedians/[id].ts',
    'middleware.ts',
    'lib/constants.ts',
    'pages/api/auth/[...nextauth].ts'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let c = fs.readFileSync(f, 'utf8');
    
    // Auth [...nextauth].ts
    c = c.replace(/const allowedAdminEmail = process\.env\.ADMIN_EMAIL \|\| 'admin@humorshub\.com';\s+if \(credentials\.email !== allowedAdminEmail\)/g,
                  'const allowedAdminEmail = process.env.ADMIN_EMAIL;\n        if (!allowedAdminEmail || credentials.email !== allowedAdminEmail)');

    // lib/constants.ts
    c = c.replace(/export const ADMIN_EMAIL = 'admin@humorshub\.com';\n/g, '');

    // middleware.ts
    c = c.replace(/if \(!session\?\.email \|\| session\.email !== 'admin@humorshub\.com'\)/g, "if (session?.role !== 'admin')");
    c = c.replace(/return token\?\.email === 'admin@humorshub\.com';/g, "return token?.role === 'admin';");

    // Other API + pages
    c = c.replace(/if \(!session\?\.user\?\.email \|\| session\.user\.email !== 'admin@humorshub\.com'\)/g, "if (session?.user?.role !== 'admin')");
    c = c.replace(/if \(!session\?\.user\?\.email \|\| \\(session\.user\.role !== 'admin' && session\.user\.email !== 'admin@humorshub\.com'\\)\)/g, "if (session?.user?.role !== 'admin')");
    c = c.replace(/if \(session\?\.user\?\.email !== 'admin@humorshub\.com'\)/g, "if (session?.user?.role !== 'admin')");

    fs.writeFileSync(f, c);
});
