import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-green-50 px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-purple-600">🎙️ Pronounce</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Sign in to continue.</p>
      </div>
      <SignIn
        appearance={{ elements: {
          card: "shadow-[0_4px_24px_rgba(139,92,246,0.12)] rounded-3xl border border-purple-100",
          primaryButton: "bg-purple-500 hover:bg-purple-600 rounded-2xl font-bold",
          formButtonPrimary: "bg-purple-500 hover:bg-purple-600 rounded-2xl",
        }}}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/signup"
      />
    </div>
  );
}
