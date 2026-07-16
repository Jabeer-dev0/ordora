export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <a href="/" className="text-lg font-bold text-ink">Back</a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-ink">Privacy Policy</h1>
        <div className="prose prose-sm mt-4 space-y-4 text-ink/70">
          <p>We are committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information.</p>
          <h2 className="text-lg font-semibold text-ink">1. Information We Collect</h2>
          <p>We collect your name, phone number, and delivery address when you place an order. We may also collect order history and preferences.</p>
          <h2 className="text-lg font-semibold text-ink">2. How We Use Your Information</h2>
          <p>We use your information to process and deliver your orders, and to communicate with you about your orders.</p>
          <h2 className="text-lg font-semibold text-ink">3. Data Protection</h2>
          <p>We implement appropriate security measures to protect your personal information. We do not sell or share your data with third parties for marketing purposes.</p>
          <h2 className="text-lg font-semibold text-ink">4. Cookies</h2>
          <p>Our platform may use cookies to improve your browsing experience and remember your preferences.</p>
          <h2 className="text-lg font-semibold text-ink">5. Your Rights</h2>
          <p>You have the right to request access to, correction of, or deletion of your personal data at any time.</p>
        </div>
      </main>
    </div>
  )
}
