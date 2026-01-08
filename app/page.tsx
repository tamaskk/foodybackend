"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { FaApple, FaGooglePlay, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaBars, FaTimes } from "react-icons/fa"
import type { Metadata } from "next"

// Note: Metadata export doesn't work with "use client" - handled in layout
export default function PalapiaLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [subscriptionName, setSubscriptionName] = useState("")
  const [subscriptionEmail, setSubscriptionEmail] = useState("")
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionMessage, setSubscriptionMessage] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscriptionLoading(true)
    setSubscriptionMessage("")

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subscriptionName,
          email: subscriptionEmail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscriptionMessage(data.message || 'Successfully subscribed!')
        setSubscriptionName("")
        setSubscriptionEmail("")
        setTimeout(() => setSubscriptionMessage(""), 5000)
      } else {
        setSubscriptionMessage(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      setSubscriptionMessage('Failed to subscribe. Please try again.')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  // Add structured data for the landing page
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://palapia.com'
  
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="bg-[#FFF8F3] text-[#2D241E] overflow-hidden">
        {/* NAVBAR */}
        <motion.nav
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6 relative"
        >
          <div className="flex items-center gap-2">
            <img 
              src="/assets/headerlogo.png" 
              alt="Palapia Logo - AI-Powered Recipe Management App"
              className="h-10"
              width={120}
              height={40}
              loading="eager"
            />
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-[#FF6B35] transition-colors">Features</a>
            <a href="#services" className="hover:text-[#FF6B35] transition-colors">Services</a>
            <a href="#testimonials" className="hover:text-[#FF6B35] transition-colors">Reviews</a>
            <a href="/contact" className="hover:text-[#FF6B35] transition-colors">Contact</a>
          </div>
          {/* <div className="hidden md:flex gap-2">
            <button className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center gap-2">
              <div className="text-base"><FaApple /></div>
              <div className="text-left">
                <div className="text-[10px] leading-tight">Download on the</div>
                <div className="text-sm font-bold leading-tight">App Store</div>
              </div>
            </button>
            <button className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center gap-2">
              <div className="text-base"><FaGooglePlay /></div>
              <div className="text-left">
                <div className="text-[10px] leading-tight">Get it on</div>
                <div className="text-sm font-bold leading-tight">Google Play</div>
              </div>
            </button>
          </div> */}
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#2D241E] text-2xl focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </motion.nav>
        
        {/* Mobile Menu - Full Page */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-white z-[10000] overflow-y-auto"
          >
            <div className="flex flex-col min-h-full">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
                <img 
                  src="/assets/headerlogo.png" 
                  alt="Palapia Logo"
                  className="h-10"
                  width={120}
                  height={40}
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#2D241E] text-2xl focus:outline-none"
                  aria-label="Close menu"
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* Menu Content */}
              <div className="flex-1 flex flex-col justify-center px-6 py-12 space-y-6">
                <a 
                  href="#features" 
                  className="block text-lg font-medium hover:text-[#FF6B35] transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#services" 
                  className="block text-lg font-medium hover:text-[#FF6B35] transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Services
                </a>
                <a 
                  href="#testimonials" 
                  className="block text-lg font-medium hover:text-[#FF6B35] transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reviews
                </a>
                <a 
                  href="/contact" 
                  className="block text-lg font-medium hover:text-[#FF6B35] transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </a>
                
                {/* <div className="pt-8 border-t border-gray-200 flex flex-col gap-4">
                  <button className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center justify-center gap-2">
                    <div className="text-base"><FaApple /></div>
                    <div className="text-left">
                      <div className="text-[10px] leading-tight">Download on the</div>
                      <div className="text-sm font-bold leading-tight">App Store</div>
                    </div>
                  </button>
                  <button className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center justify-center gap-2">
                    <div className="text-base"><FaGooglePlay /></div>
                    <div className="text-left">
                      <div className="text-[10px] leading-tight">Get it on</div>
                      <div className="text-sm font-bold leading-tight">Google Play</div>
                    </div>
                  </button>
                </div> */}
              </div>
            </div>
          </motion.div>
        )}

        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6">
                Your Trusted Partner for <span className="text-[#FF6B35]">Recipe Management</span>
              </h1>
              <p className="text-lg text-[#8B7E74] mb-8 leading-relaxed">
                Save, organize, and share recipes with AI-powered tools. Join thousands of home cooks making meal planning effortless.
              </p>
              {/* <div className="flex gap-4 mb-8 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-black text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3"
                >
                  <div className="text-xl"><FaApple /></div>
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-base font-bold">App Store</div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-black text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3"
                >
                  <div className="text-xl"><FaGooglePlay /></div>
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="text-base font-bold">Google Play</div>
                  </div>
                </motion.button>
              </div> */}
              
              {/* Email Subscription Form */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-center lg:text-left">Get Notified When We Launch</h3>
                <form onSubmit={handleSubscribe} className="flex flex-col lg:flex-row gap-3 justify-center lg:justify-start">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={subscriptionName}
                    onChange={(e) => setSubscriptionName(e.target.value)}
                    required
                    className="px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    aria-label="Your Name"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={subscriptionEmail}
                    onChange={(e) => setSubscriptionEmail(e.target.value)}
                    required
                    className="px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    aria-label="Your Email"
                  />
                  <motion.button
                    type="submit"
                    disabled={subscriptionLoading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#FF6B35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF5722] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscriptionLoading ? 'Subscribing...' : 'Subscribe'}
                  </motion.button>
                </form>
                {subscriptionMessage && (
                  <div className={`text-sm mt-2 text-center lg:text-left ${subscriptionMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {subscriptionMessage}
                  </div>
                )}
              </div>
            </motion.div>

            {/* HERO PHONE MOCK */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-start lg:justify-center lg:ml-8"
            >
              <div className="relative z-10 max-w-sm mx-auto lg:mx-0">
                <img 
                  src="/assets/recipepage.jpeg" 
                  alt="Palapia Recipe App Screenshot - View recipe details and cooking instructions"
                  className="w-auto h-[500px] rounded-[2.5rem] shadow-2xl mx-auto"
                  width={400}
                  height={500}
                  loading="eager"
                />
              </div>
            </motion.div>
          </div>

          {/* Partner Logos */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 pt-8 border-t border-gray-200"
          >
            <div className="flex justify-center items-center gap-12 flex-wrap opacity-40">
              <LogoText text="TikTok" />
              <LogoText text="Instagram" />
              <LogoText text="OpenAI" />
              <LogoText text="Firebase" />
              <LogoText text="Stripe" />
            </div>
          </motion.div> */}
        </section>

        {/* FEATURE 1 - MY CART / SAVED RECIPES */}
        <section id="features" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex justify-center lg:justify-start"
              >
                <div className="bg-[#FF6B35] w-fit mx-auto lg:mx-0 rounded-[3rem] p-8 lg:p-12 flex flex-col items-center justify-center">
                {/* <PhoneMockup bgColor="white">
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-4">My Saved</h3>
                    <SavedRecipeItem 
                      title="AI Chef salad"
                      price="Ready in 20min"
                      image="🥗"
                    />
                    <SavedRecipeItem 
                      title="Spaghetti recipe"
                      price="Ready in 30min"
                      image="🍝"
                    />
                    <SavedRecipeItem 
                      title="Air installation"
                      price="Ready in 15min"
                      image="🥙"
                    />
                  </div>
                </PhoneMockup> */}
            {/* <div className="relative z-10 max-w-sm mx-auto"> */}
              <img 
                src="/assets/addrecipesoptions.jpeg" 
                alt="Palapia App - Add recipes from multiple sources including social media and photos"
                className="w-auto h-[500px] rounded-[2.5rem] shadow-2xl mx-auto"
                width={400}
                height={500}
                loading="lazy"
              />
            {/* </div> */}
                
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-[#FFE5D9] px-4 py-1 rounded-full text-sm font-semibold text-[#FF6B35] mb-4">
                Save Recipes
              </div>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                Smart and secure recipe management
              </h2>
              <p className="text-[#8B7E74] mb-8 leading-relaxed">
                Keep all your favorite recipes organized in one place. Access them anytime on your phone.
              </p>
              
              <div className="space-y-6">
                <FeatureItem 
                  number="1"
                  title="Fast & Easy Saving"
                  description="Save recipes from social media with just a link. Our AI extracts all the details automatically."
                />
                <FeatureItem 
                  number="2"
                  title="Available 24/7"
                  description="Access your recipes anytime, anywhere. Cook what you love whenever inspiration strikes."
                />
                <FeatureItem 
                  number="3"
                  title="Secure Backup"
                  description="Your recipes are safely stored in the cloud. Never lose a favorite recipe again."
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block bg-[#FFE5D9] px-4 py-1 rounded-full text-sm font-semibold text-[#FF6B35] mb-4">
                Your Kitchen
              </div>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                Effortless living with trusted recipes
              </h2>
              <p className="text-[#8B7E74] mb-8 leading-relaxed">
                Join thousands of home cooks who are making meal planning simpler. Whether you&apos;re a beginner or a pro chef, Palapia makes cooking enjoyable.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#FF6B35] text-white px-8 py-3 rounded-full font-semibold"
              >
                Get Started
              </motion.button>

              <div className="grid grid-cols-2 gap-8 mt-12">
                <StatBox value="50,000+" label="Active users" />
                <StatBox value="1500+" label="Service Providers" />
                <StatBox value="4.9/5" label="Average Rating" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex justify-center lg:justify-end"
            >
              <img 
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=700&fit=crop" 
                alt="People cooking together in a modern kitchen"
                className="rounded-3xl shadow-2xl w-full max-w-sm mx-auto lg:mx-0 object-cover"
                width={600}
                height={700}
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="services" className="py-20 bg-[#FFF8F3]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block bg-[#FFE5D9] px-4 py-1 rounded-full text-sm font-semibold text-[#FF6B35] mb-4">
              Recipe App
            </div>
            <h2 className="text-4xl font-black mb-4">
              From booking to payment <br />here&apos;s how
            </h2>
            <p className="text-[#8B7E74] max-w-2xl mx-auto mb-16">
              Easily cook meals like a service professional by following recipes at your own pace. Palapia makes every step seamless and enjoyable.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8 text-left"
            >
              <ProcessStep 
                number="1"
                title="Select a Recipe"
                description="Browse our catalog, import from social media, or generate recipes with AI based on your preferences."
              />
              <ProcessStep 
                number="2"
                title="Save Your Schedule"
                description="Bookmark recipes for later, create meal plans, and organize your cooking week effortlessly."
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative max-w-sm mx-auto flex justify-center"
            >
              <img 
                src="/assets/feed.jpeg" 
                alt="Palapia Recipe Feed - Browse and discover new recipes from the community"
                className="w-auto h-[700px] max-h-[700px] rounded-[2.5rem] shadow-2xl mx-auto"
                width={400}
                height={700}
                loading="lazy"
              />
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1 flex justify-center lg:justify-start"
            >
              <img 
                src="/assets/profilepage.jpeg" 
                alt="Palapia User Profile - Track your cooking achievements and saved recipes"
                className="w-auto h-[700px] max-h-[700px] rounded-[2.5rem] shadow-2xl mx-auto lg:mx-0"
                width={400}
                height={700}
                loading="lazy"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8 text-left order-1 lg:order-2"
            >
              <ProcessStep 
                number="3"
                title="Get Notified"
                description="Receive real-time notifications for recipe updates, social interactions, achievements unlocked, and more."
              />
              <ProcessStep 
                number="4"
                title="Pay Securely & Save"
                description="Upgrade to Pro with secure Stripe payments. Unlock unlimited recipes, premium features, and ad-free cooking."
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-[#FFE5D9] px-4 py-1 rounded-full text-sm font-semibold text-[#FF6B35] mb-4">
              Testimonial
            </div>
            <h2 className="text-4xl font-black mb-4">
              Recipe management made easy <br />hear it straight from our users
            </h2>
            <p className="text-[#8B7E74] max-w-2xl mx-auto">
              Every cook is a critic but we&apos;ve received amazing love from thousands of home cooks using Palapia every day to make meals easy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              text="An amazing platform where I never have to worry about losing my favorite recipes. The AI import feature is incredible!"
              author="Sarah Mitchell"
              role="Home Chef"
              avatar="/assets/kover.webp"
            />
            <TestimonialCard 
              text="I love the emergency call feature! Whenever I need help with a recipe, the community is there for me. It's like having friends cooking with me."
              author="David Park"
              role="Food Blogger"
              avatar="/assets/ader.jpg"
            />
            <TestimonialCard 
              text="Their gamification with achievements and levels keeps me motivated to try new recipes. I've discovered so many amazing dishes!"
              author="Emma Wilson"
              role="Cooking Enthusiast"
              avatar="/assets/szili.jpg"
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-[#FF6B35] to-[#FF8C42]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-white"
            >
              <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                One app for fast, trusted recipe management
              </h2>
              <p className="text-white/90 mb-8 text-lg leading-relaxed">
                Quick, smart recipe tool that puts you on track to cooking success. Accessible with just one tap, you can easily manage all your recipes, meal plans, and cooking adventures in one beautiful app.
              </p>
              {/* <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-black text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3"
                >
                  <div className="text-xl"><FaApple /></div>
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-base font-bold">App Store</div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-black text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3"
                >
                  <div className="text-xl"><FaGooglePlay /></div>
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="text-base font-bold">Google Play</div>
                  </div>
                </motion.button>
              </div> */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="grid grid-cols-2 gap-4 lg:gap-20 mx-auto lg:mx-0">
                  <img 
                    src="/assets/newrecipeaddIngredients.jpeg" 
                    alt="Palapia Recipe Creation - Add ingredients and create custom recipes"
                    className="w-auto h-[400px] max-h-[400px] rounded-[2.5rem] shadow-2xl"
                    width={300}
                    height={400}
                    loading="lazy"
                  />
                  <img 
                    src="/assets/recipedetails.jpeg" 
                    alt="Palapia Recipe Details - View complete recipe instructions and cooking steps"
                    className="w-auto h-[400px] max-h-[400px] rounded-[2.5rem] shadow-2xl"
                    width={300}
                    height={400}
                    loading="lazy"
                  />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2D241E] text-[#F9F7F2] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/assets/headerlogo.png" 
                  alt="Palapia Logo"
                  className="h-8"
                  width={120}
                  height={32}
                />
              </div>
              <p className="text-sm opacity-70 mb-4">
                A unified platform that connects foodies for sharing, learning, and more. Restaurant quality cooking at home with AI-powered recipe tools.
              </p>
              <div className="flex gap-3">
                <SocialIcon icon={<FaFacebook />} />
                <SocialIcon icon={<FaTwitter />} />
                <SocialIcon icon={<FaInstagram />} />
                <SocialIcon icon={<FaLinkedin />} />
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Menu</h4>
              <div className="space-y-2 text-sm opacity-70">
                <a href="/" className="block hover:opacity-100 cursor-pointer">Home</a>
                <a href="/#features" className="block hover:opacity-100 cursor-pointer">About</a>
                <a href="/#services" className="block hover:opacity-100 cursor-pointer">Services</a>
                <a href="/contact" className="block hover:opacity-100 cursor-pointer">Contact</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <div className="space-y-2 text-sm opacity-70">
                <p className="hover:opacity-100 cursor-pointer">AI Recipe Import</p>
                <p className="hover:opacity-100 cursor-pointer">Picture Analysis</p>
                <p className="hover:opacity-100 cursor-pointer">Household Management</p>
                <p className="hover:opacity-100 cursor-pointer">See all</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Help</h4>
              <div className="space-y-2 text-sm opacity-70">
                <p className="hover:opacity-100 cursor-pointer">FAQ</p>
                <p className="hover:opacity-100 cursor-pointer">Contact us</p>
                <p className="hover:opacity-100 cursor-pointer">Support</p>
                <p className="hover:opacity-100 cursor-pointer">Updates</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-70">
            <p>© 2025 Palapia. Recipes are for everyone.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:opacity-100">Privacy Policy</a>
              <a href="#" className="hover:opacity-100">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

/* ============ COMPONENTS ============ */

function PhoneMockup({ children, bgColor = "white", compact = false }: { children: React.ReactNode; bgColor?: string; compact?: boolean }) {
  return (
    <div className={`relative ${compact ? 'w-40' : 'max-w-sm'} mx-auto`}>
      <div className="bg-black rounded-[2.5rem] p-2">
        <div className="bg-gray-900 rounded-[2.2rem] p-1">
          <div className={`bg-${bgColor} rounded-[2rem] overflow-hidden ${compact ? 'h-72' : 'h-[32rem]'}`}>
            {/* Notch */}
            <div className="bg-black h-6 w-32 mx-auto rounded-b-2xl"></div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-medium whitespace-nowrap">
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  )
}

function RecipeMiniCard({ title, time, color }: { title: string; time: string; color: string }) {
  return (
    <div className="rounded-xl p-3 mb-2 flex items-center justify-between" style={{ backgroundColor: color }}>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-gray-600">{time}</p>
      </div>
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">→</div>
    </div>
  )
}

function SavedRecipeItem({ title, price, image }: { title: string; price: string; image: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 mb-3 flex items-center gap-3">
      <div className="w-16 h-16 bg-gradient-to-br from-[#FFE5D9] to-[#FFF3D9] rounded-xl flex items-center justify-center text-2xl">
        {image}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-[#FF6B35] font-medium">{price}</p>
      </div>
      <div className="text-xl">→</div>
    </div>
  )
}

function LogoText({ text }: { text: string }) {
  return <div className="font-bold text-lg">{text}</div>
}

function FeatureItem({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-[#FFE5D9] text-[#FF6B35] flex items-center justify-center font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-sm text-[#8B7E74]">{description}</p>
      </div>
    </div>
  )
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-black text-[#FF6B35] mb-1">{value}</p>
      <p className="text-sm text-[#8B7E74]">{label}</p>
    </div>
  )
}

function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-black text-lg flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        <p className="text-[#8B7E74]">{description}</p>
      </div>
    </div>
  )
}

function NotificationCard({ icon, title, description, time }: { icon: string; title: string; description: string; time: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-3 flex items-start gap-3">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm mb-0.5">{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  )
}

function TestimonialCard({ text, author, role, avatar }: { text: string; author: string; role: string; avatar: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#FFF8F3] rounded-3xl p-8 border border-gray-100"
    >
      <p className="text-[#8B7E74] mb-6 leading-relaxed">&quot;{text}&quot;</p>
      <div className="flex items-center gap-3">
        {/* <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] rounded-full flex items-center justify-center text-2xl">
          {avatar}
        </div> */}
        {/* Avatar should be a profile picture */}
        {/* <img 
          src={avatar}
          alt="Profile Picture"
          className="w-12 h-12 rounded-full"
        /> */}
        <div className="w-12 h-12 rounded-full" style={{ backgroundImage: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

        </div>
        <div>
          <p className="font-bold text-sm">{author}</p>
          <p className="text-xs text-[#8B7E74]">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors text-xl">
      {icon}
    </div>
  )
}
