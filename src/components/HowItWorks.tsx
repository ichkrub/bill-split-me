import React from 'react';
import { Upload, Users, Calculator, Share2 } from 'lucide-react';

export function HowItWorks() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-2">How It Works</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Split bills effortlessly—no more confusion over who pays what!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {/** Step 1 **/}
        <div className="card p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">1. Upload Your Receipt</h3>
          <p className="text-sm text-gray-600 mt-2">
            Snap a photo of your receipt or enter items manually. Our smart AI extracts prices, making bill splitting effortless.
          </p>
        </div>

        {/** Step 2 **/}
        <div className="card p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">2. Add People to the Bill</h3>
          <p className="text-sm text-gray-600 mt-2">
            Add friends, family, or colleagues who are sharing the bill. Easily update the list anytime.
          </p>
        </div>

        {/** Step 3 **/}
        <div className="card p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">3. Assign Items to Everyone</h3>
          <p className="text-sm text-gray-600 mt-2">
            Select who ordered each item. Easily split shared dishes between multiple people.
          </p>
        </div>

        {/** Step 4 **/}
        <div className="card p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Share2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">4. Share and Settle the Bill</h3>
          <p className="text-sm text-gray-600 mt-2">
            Share the final bill with friends. Get a detailed breakdown, including tax and service charges.
          </p>
        </div>
      </div>
    </div>
  );
}