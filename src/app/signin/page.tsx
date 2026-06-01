import { Nav } from "@/components/nav";
import { SigninForm } from "./signin-form";

export default function SigninPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <SigninForm />
      </section>
    </main>
  );
}
