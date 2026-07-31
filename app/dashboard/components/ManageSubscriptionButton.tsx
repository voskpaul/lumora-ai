"use client";

export default function ManageSubscriptionButton() {
  const openPortal = async () => {
    try {
      const res = await fetch(
        "/api/stripe/customer-portal",
        {
          method: "POST",
        }
      );

      const data = await res.json();

      console.log(data);

      if (!res.ok) {
        alert(
          data.error || "Request failed"
        );
        return;
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(error);
      alert("Failed to connect to API");
    }
  };

  return (
    <button
      onClick={openPortal}
      className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-black"
    >
      Manage Subscription
    </button>
  );
}