import { Nav } from "@/components/nav";
import { PaypalCapture } from "./paypal-capture";

export default function PaypalReturnPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">PayPal Return</h1>
        <PaypalCapture />
      </section>
    </main>
  );
}
