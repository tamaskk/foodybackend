import connectDB from '@/lib/db';
import Bill from '@/models/Bill';
import User from '@/models/User';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-600">Error</h1>
          <p className="text-gray-700">No session ID found. Please contact support.</p>
        </div>
      </main>
    );
  }

  await connectDB();
  const bill = await Bill.findOne({ stripeSessionId: sessionId }).lean();

  if (!bill) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-3xl font-bold text-yellow-600">Processing...</h1>
          <p className="text-gray-700">
            We are confirming your payment. Please refresh in a few seconds.
          </p>
        </div>
      </main>
    );
  }

  // Fetch user data separately
  const user = await User.findById(bill.userId).select('name email').lean();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-green-600 px-8 py-6 text-white text-center">
          <h1 className="text-2xl font-bold">Payment Successful</h1>
          <p className="opacity-90">Thank you for your purchase!</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="border-b pb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Receipt Details
            </h2>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plan</span>
              <span className="font-bold text-gray-900">{bill.planName}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-gray-900">
                {bill.amount.toFixed(2)} {bill.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                {bill.status}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Billing Information
            </h2>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{user?.name || 'N/A'}</p>
              <p className="text-gray-500">{user?.email || 'N/A'}</p>
              <p className="text-gray-400 mt-2 font-mono text-[10px]">Session: {bill.stripeSessionId}</p>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <a
              href="recipesave://subscription"
              className="block w-full bg-black text-white text-center font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to App
            </a>
            <p className="text-center text-gray-500 text-xs italic">
              If the button doesn't work, manually return to the app to enjoy your Pro features.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

