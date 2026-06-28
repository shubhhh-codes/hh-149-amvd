import React from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import clientPromise from '../lib/mongodb';

interface Policy {
  _id: string;
  title: string;
  content: string;
  category: string;
}

interface PoliciesProps {
  policies: Policy[];
}

export default function Policies({ policies }: PoliciesProps) {
  const router = useRouter();

  return (
    <div className="font-body-md text-on-surface antialiased bg-[#0A0A0A] flex flex-col min-h-screen">
      <Head>
        <title>The Humours Hub</title>
      </Head>
      <Navbar />
      <main className="flex-grow flex justify-center w-full pt-16 pb-32 px-margin-mobile md:px-margin-desktop relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="w-full max-w-[800px] bg-[#141414] border border-white/5 rounded-lg p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
          <article className="prose prose-invert prose-orange max-w-none">
            <header className="mb-16 text-center border-b border-white/5 pb-12">
              <span className="material-symbols-outlined text-primary-container text-[48px] mb-6 block" data-icon="gavel">gavel</span>
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">Policies &amp; Terms</h1>

            </header>
            <div className="font-body-lg text-body-lg text-on-surface space-y-12">
              {policies.length > 0 ? (
                policies.map((policy, index) => (
                  <div key={policy._id}>
                    <section>
                      <h2 className="font-headline-md text-headline-md text-primary-container mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined" data-icon="description">
                          {index % 3 === 0 ? 'description' : index % 3 === 1 ? 'privacy_tip' : 'currency_exchange'}
                        </span>
                        {policy.title}
                      </h2>
                      <div className="space-y-4 text-on-surface-variant" dangerouslySetInnerHTML={{ __html: policy.content }} />
                    </section>
                    {index < policies.length - 1 && (
                      <div className="w-full h-px bg-white/5 my-12"></div>
                    )}
                  </div>
                ))
              ) : (
                <section className="text-center text-on-surface-variant">
                  <p>No policies have been published yet.</p>
                </section>
              )}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const client = await clientPromise;
    const db = client.db();

    const policies = await db
      .collection('homepage_content')
      .find({ type: 'policy', isVisible: true })
      .sort({ displayOrder: 1 })
      .toArray();

    return {
      props: {
        policies: JSON.parse(JSON.stringify(policies)),
      },
    };
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    return {
      props: {
        policies: [],
      },
    };
  }
};