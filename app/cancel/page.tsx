export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-red-600">Payment Cancelled</h1>
        <p className="text-gray-700">
          Your payment wasn&apos;t completed. If you change your mind, you can reopen the upgrade
          link or start a new checkout from the app.
        </p>
      </div>
    </main>
  );
}

