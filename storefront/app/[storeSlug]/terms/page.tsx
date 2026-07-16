export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <a href="/" className="text-lg font-bold text-ink">Back</a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-ink">Terms &amp; Conditions</h1>
        <div className="prose prose-sm mt-4 space-y-4 text-ink/70">
          <p>These Terms and Conditions govern your use of our online ordering service. By placing an order through our platform, you agree to be bound by these terms.</p>
          <h2 className="text-lg font-semibold text-ink">1. Orders</h2>
          <p>All orders placed through our platform are subject to availability. We reserve the right to refuse or cancel any order for any reason.</p>
          <h2 className="text-lg font-semibold text-ink">2. Payment</h2>
          <p>Payment is due at the time of ordering for collection orders. Delivery orders may be paid in cash upon delivery.</p>
          <h2 className="text-lg font-semibold text-ink">3. Cancellation</h2>
          <p>You may cancel your order before it has been prepared. Once preparation has begun, cancellation may not be possible.</p>
          <h2 className="text-lg font-semibold text-ink">4. Allergen Information</h2>
          <p>While we endeavour to provide accurate allergen information, we cannot guarantee that our food is free from allergens. Please contact us directly if you have severe allergies.</p>
          <h2 className="text-lg font-semibold text-ink">5. Collection &amp; Delivery</h2>
          <p>Collection orders must be collected within 30 minutes of the stated ready time. Delivery times are estimates and may vary.</p>
        </div>
      </main>
    </div>
  )
}
