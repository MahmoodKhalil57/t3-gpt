import "server-only";

import '~/styles/landing/globals.css'
import '~/styles/auth/globals.css'
import GoogleSignIn from "~/app/_components/GoogleSignIn";
import EmailLogin from "~/app/_components/EmailLogin";
import { validateOrRedirect } from "~/server/authUtils";

export default async function Home() {
  await validateOrRedirect(true);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white ">

      <div className="bg-[#131417] h-auto min-h-screen p-12 lg:p-24">
        <div className="container mx-auto max-w-xs p-4 flex flex-col gap-2">
          <EmailLogin />
          <div className="flex flex-col">
            <GoogleSignIn />

            {/* <p className="text-sm text-center text-white mt-4">
              Don't have an account?
              <a href="/signup" className="text-blue-500 hover:underline">Sign Up</a>
            </p> */}
          </div>
        </div>
      </div>
    </main >
  );
}