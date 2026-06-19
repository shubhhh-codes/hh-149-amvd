const fs = require('fs');

const content = fs.readFileSync('pages/dashboard.tsx', 'utf8');
const match = content.match(/  return \(\r?\n    <div className="min-h-screen/);
if (!match) {
  console.error("Could not find the target return block");
  process.exit(1);
}

const prefix = content.substring(0, match.index);

const newReturn = `  return (
    <div className="bg-background min-h-screen text-on-surface font-body-md overflow-x-hidden">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/95 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-container-max mx-auto">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
            The Humours Hub
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md text-body-md" href="/">Explore</Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md text-body-md" href="#">Community</Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md text-body-md" href="#">Artists</Link>
            <span className="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md">Dashboard</span>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/book-tickets" className="bg-primary text-on-primary font-headline-sm text-headline-sm px-6 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all">
              Book Tickets
            </Link>
            <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-surface-container-high">
              {session?.user?.image ? (
                <img className="w-full h-full object-cover" src={session.user.image} alt={session.user.name || 'User'} />
              ) : (
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen">
        {/* Welcome Section */}
        <section className="bg-surface-container brutal-border p-8 rounded-xl mb-gutter spotlight-glow relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface mb-2">
                Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest'}! 👋
              </h1>
              <p className="text-on-surface-variant font-body-lg text-body-lg">Manage your bookings and payments all in one place.</p>
            </div>
            <div className="h-24 w-24 bg-surface-container-high border-2 border-tertiary-container/30 rounded-full flex items-center justify-center relative shadow-xl shrink-0">
              <span className="material-symbols-outlined text-tertiary text-5xl fill-icon">person</span>
              <div className="absolute -bottom-1 -right-1 bg-primary w-8 h-8 rounded-full border-4 border-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-sm font-bold">verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter">
          {/* Total Bookings */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/40 brutal-border p-8 rounded-xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
            <div>
              <p className="font-label-caps text-label-caps text-blue-200 mb-2">TOTAL BOOKINGS</p>
              <p className="font-display-lg text-display-lg text-white">{stats.total}</p>
            </div>
            <span className="material-symbols-outlined text-blue-400 text-6xl opacity-30 group-hover:opacity-100 transition-opacity">confirmation_number</span>
          </div>
          {/* Approved */}
          <div className="bg-gradient-to-br from-green-600/20 to-green-900/40 brutal-border p-8 rounded-xl flex items-center justify-between group hover:border-green-500/50 transition-all">
            <div>
              <p className="font-label-caps text-label-caps text-green-200 mb-2">APPROVED</p>
              <p className="font-display-lg text-display-lg text-white">{stats.approved}</p>
            </div>
            <span className="material-symbols-outlined text-green-400 text-6xl opacity-30 group-hover:opacity-100 transition-opacity">check_circle</span>
          </div>
          {/* Pending */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/40 brutal-border p-8 rounded-xl flex items-center justify-between group hover:border-yellow-500/50 transition-all">
            <div>
              <p className="font-label-caps text-label-caps text-yellow-200 mb-2">PENDING</p>
              <p className="font-display-lg text-display-lg text-white">{stats.pending}</p>
            </div>
            <span className="material-symbols-outlined text-yellow-400 text-6xl opacity-30 group-hover:opacity-100 transition-opacity">schedule</span>
          </div>
        </section>

        {/* Tabs Navigation */}
        <nav className="flex space-x-4 mb-gutter">
          <button
            onClick={() => setActiveTab('bookings')}
            className={\`flex items-center px-8 py-4 rounded-xl font-label-caps text-label-caps transition-all border \${
              activeTab === 'bookings'
                ? 'bg-tertiary/10 text-tertiary active-tab-glow border-tertiary/30'
                : 'text-on-surface-variant hover:bg-surface-container-high border-transparent'
            }\`}
          >
            <span className="material-symbols-outlined mr-2">event</span>
            MY BOOKINGS
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={\`flex items-center px-8 py-4 rounded-xl font-label-caps text-label-caps transition-all border \${
              activeTab === 'payments'
                ? 'bg-tertiary/10 text-tertiary active-tab-glow border-tertiary/30'
                : 'text-on-surface-variant hover:bg-surface-container-high border-transparent'
            }\`}
          >
            <span className="material-symbols-outlined mr-2">payments</span>
            PAYMENT HISTORY
          </button>
        </nav>

        {/* Content Table Container */}
        <div className="bg-surface-container brutal-border rounded-xl overflow-hidden">
          {/* Bookings View */}
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto block">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">BOOKING DATE</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">EVENT DETAILS</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">STATUS</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.filter(booking => booking.status === 'approved').length > 0 ? (
                    bookings.filter(booking => booking.status === 'approved').map(booking => (
                      <tr key={booking._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="font-body-lg text-body-lg text-white">{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-on-surface-variant">{new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-8 py-6">
                          {booking.isComedianBooking ? (
                            <>
                              <p className="font-headline-sm text-headline-sm text-on-surface">Comedian Registration</p>
                              <p className="text-sm text-primary flex items-center mt-1">
                                <span className="material-symbols-outlined text-sm mr-1">mic</span>
                                {booking.comedianProfile?.comedianType || 'Stand-up'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-headline-sm text-headline-sm text-on-surface">Show Tickets</p>
                              <p className="text-sm text-primary flex items-center mt-1">
                                <span className="material-symbols-outlined text-sm mr-1">confirmation_number</span>
                                {booking.numberOfTickets} Ticket(s)
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                            APPROVED
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right whitespace-nowrap">
                          <button onClick={() => downloadTicket(booking)} className="bg-[#793de6] text-white px-6 py-2.5 rounded-xl font-label-caps text-label-caps hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#793de6]/20">
                            DOWNLOAD TICKET
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-6xl opacity-20 mb-4 block">event_busy</span>
                        No approved bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments View */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto block">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">DATE</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">PAYMENT ID</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">DETAILS</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant">AMOUNT</th>
                    <th className="px-8 py-5 font-label-caps text-label-caps text-on-surface-variant text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.length > 0 ? (
                    payments.map(payment => (
                      <tr key={payment._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-white">{new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-on-surface-variant">{new Date(payment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <code className="bg-surface-container-highest px-2 py-1 rounded text-xs text-on-surface block">{payment.paymentId}</code>
                          <p className="text-xs text-on-surface-variant mt-1">Order: {payment.orderId}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-on-surface">Show Tickets ({payment.bookingDetails?.numberOfTickets || 0} Tickets)</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="font-bold text-white">{formatCurrency(payment.amount / 100)}</p>
                        </td>
                        <td className="px-8 py-6 text-right whitespace-nowrap">
                          <span className={\`font-bold \${payment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}\`}>
                            {payment.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-white/10 mb-4 block">history_edu</span>
                        <p className="text-on-surface-variant">No payment records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/5 bg-surface-container-lowest">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-container-max mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="font-headline-sm text-headline-sm font-bold text-primary mb-2">The Humours Hub</div>
            <p className="font-body-md text-body-md text-on-secondary-container">© 2024 The Humours Hub. Built for Ahmedabad's Live Scene.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/terms" className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary underline transition-all duration-300">Terms of Service</Link>
            <Link href="/privacy" className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary underline transition-all duration-300">Privacy Policy</Link>
            <Link href="/contact" className="font-label-caps text-label-caps text-on-secondary-container hover:text-primary underline transition-all duration-300">Contact Support</Link>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-primary/20 transition-all">
              {/* Instagram Icon Placeholder */}
              <span className="text-white text-xs">IG</span>
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-primary/20 transition-all">
              {/* Facebook Icon Placeholder */}
              <span className="text-white text-xs">FB</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
`;

fs.writeFileSync('pages/dashboard.tsx', prefix + newReturn);
