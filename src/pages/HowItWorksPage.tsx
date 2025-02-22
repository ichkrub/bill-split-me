import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Receipt, ArrowRight, Upload, Users, Calculator, Share2, CreditCard, Globe, CheckCircle, Home, Plane, ShoppingBag, ChevronDown } from 'lucide-react';

export function HowItWorksPage() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>How to Split Bills Fairly with BillSplit.me - No More Awkward Math</title>
        <meta name="description" content="Need to split a bill fast? BillSplit.me lets you upload receipts, assign items, and share fair cost breakdowns, including tax & tip. No sign-up needed!" />
        <meta name="keywords" content="split bills app, bill splitting calculator, fair bill sharing, best way to split a bill, group expense tracker, share restaurant bill" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.billsplit.me/how-it-works" />
      </Helmet>

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Receipt className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">BillSplit Me</h1>
            </Link>
            <Link to="/" className="btn btn-primary flex items-center gap-1">
              <span>Start Splitting</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-100 text-center py-16">
          <div className="max-w-screen-lg mx-auto px-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              The Fastest & Fairest Way to Split Any Bill
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              No more awkward calculations or unfair splits. BillSplit.me makes it fast, accurate, and hassle-free.
            </p>
            <Link to="/" className="btn btn-primary text-lg py-4 px-8 inline-flex items-center gap-2">
              Start Splitting Bills
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="max-w-screen-lg mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Upload className="w-6 h-6 text-primary" />,
                  title: "Snap or Upload Your Receipt",
                  description: "Take a photo of your receipt or upload an image. Our AI automatically extracts all items, prices, and tax details."
                },
                {
                  icon: <Users className="w-6 h-6 text-primary" />,
                  title: "Select Who Ordered What",
                  description: "Add names and check off the items each person ordered. Works great for shared dishes too!"
                },
                {
                  icon: <Calculator className="w-6 h-6 text-primary" />,
                  title: "Instant, Accurate Splits",
                  description: "We calculate everyone’s share, including tax and tip, so no one overpays."
                },
                {
                  icon: <Share2 className="w-6 h-6 text-primary" />,
                  title: "Share & Settle the Bill",
                  description: "Send the detailed breakdown to friends. They see exactly what they owe, no confusion!"
                }
              ].map((step, index) => (
                <div key={index} className="card p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-white">
          <div className="max-w-screen-lg mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Perfect for Any Group Expense</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Home className="w-6 h-6 text-primary" />,
                  title: "🏡 Splitting Rent & Utilities",
                  description: "Fairly divide rent, electricity, and internet bills with roommates. No more arguments over who owes what."
                },
                {
                  icon: <Plane className="w-6 h-6 text-primary" />,
                  title: "✈️ Group Travel Expenses",
                  description: "Easily split shared vacation costs like hotels, transportation, and meals. Enjoy your trip without worrying about expenses."
                },
                {
                  icon: <ShoppingBag className="w-6 h-6 text-primary" />,
                  title: "🍽️ Dining & Restaurant Bills",
                  description: "No more splitting by total—pay exactly what you owe. Perfect for group dinners and outings."
                },
                {
                  icon: <CreditCard className="w-6 h-6 text-primary" />,
                  title: "💳 Shared Subscriptions",
                  description: "Divide the cost of shared subscriptions like Netflix, Spotify, and more. Keep everyone happy and entertained."
                },
                {
                  icon: <Globe className="w-6 h-6 text-primary" />,
                  title: "🌍 International Expenses",
                  description: "Handle expenses in different currencies with ease. Perfect for international trips and collaborations."
                },
                {
                  icon: <CheckCircle className="w-6 h-6 text-primary" />,
                  title: "✅ Event Planning",
                  description: "Split costs for events like weddings, parties, and reunions. Ensure everyone contributes their fair share."
                }
              ].map((useCase, index) => (
                <div key={index} className="card p-6 text-center shadow-md hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-semibold mt-4">{useCase.title}</h3>
                  <p className="text-gray-600 mt-2">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-screen-lg mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  question: "Is BillSplit.me really free?",
                  answer: "Yes! BillSplit.me is 100% free with no hidden fees or sign-ups required."
                },
                {
                  question: "What currencies are supported?",
                  answer: "Our app works with any currency. Simply upload your receipt or enter amounts manually."
                },
                {
                  question: "Can I split shared items?",
                  answer: "Absolutely! You can assign any item to multiple people, and we'll divide the cost fairly."
                },
                {
                  question: "What if I don’t have a receipt?",
                  answer: "No problem! You can manually enter items and their prices, and we’ll handle the math."
                }
              ].map((faq, index) => (
                <details key={index} className="bg-white p-4 rounded-lg shadow-sm cursor-pointer">
                  <summary className="font-semibold flex justify-between items-center">
                    {faq.question} <ChevronDown className="w-5 h-5" />
                  </summary>
                  <p className="text-gray-600 mt-2">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 py-16 text-center">
          <div className="max-w-screen-lg mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Split Bills the Easy Way</h2>
            <Link to="/" className="btn btn-primary text-lg py-4 px-8 inline-flex items-center gap-2">
              Try It Now
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-screen-lg mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-2">
            <p className="text-gray-500 text-sm">
              © 2025 <a href="https://www.smbee.me" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SMBee</a>. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/how-it-works" className="text-sm text-gray-500 hover:text-primary hover:underline">
                How It Works
              </Link>
              <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}