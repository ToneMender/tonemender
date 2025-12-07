export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-[360px] text-center">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>

        <p className="text-sm mb-4">
          We just sent you a confirmation link.  
          Please verify your email to activate your account.
        </p>

        <p className="text-sm text-gray-500">
          If you don’t see it, check your spam or junk folder.
        </p>
      </div>
    </main>
  );
}