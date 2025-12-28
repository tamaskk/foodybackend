"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Image from "next/image"
import { 
  FaFacebook, 
  FaInstagram, 
  FaTiktok, 
  FaApple, 
  FaAndroid,
  FaEnvelope,
  FaComments,
  FaMobileAlt,
  FaTwitter,
  FaLinkedin,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitting(false)
        setSubmitStatus("success")
        
        // Reset form after success
        setTimeout(() => {
          setFormData({ name: "", email: "", subject: "", message: "" })
          setSubmitStatus("idle")
        }, 5000)
      } else {
        setIsSubmitting(false)
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setIsSubmitting(false)
      setSubmitStatus("error")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="bg-[#FFF8F3] text-[#2D241E] min-h-screen">
      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6"
      >
        <a href="/" className="flex items-center gap-2">
          <div className="bg-[#FF6B35] text-white px-3 py-1 rounded-lg font-black text-xl">
            Foody
          </div>
        </a>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="/#features" className="hover:text-[#FF6B35] transition-colors">Features</a>
          <a href="/#services" className="hover:text-[#FF6B35] transition-colors">Services</a>
          <a href="/#testimonials" className="hover:text-[#FF6B35] transition-colors">Reviews</a>
          <a href="/contact" className="text-[#FF6B35] font-semibold">Contact</a>
        </div>
        <div className="flex gap-2">
          <a href="/" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center gap-2">
            <div className="text-base"><FaApple /></div>
            <div className="text-left">
              <div className="text-[10px] leading-tight">Download on the</div>
              <div className="text-xs font-bold leading-tight">App Store</div>
            </div>
          </a>
          <a href="/" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FF5722] transition-colors flex items-center gap-2">
            <div className="text-base"><FaAndroid /></div>
            <div className="text-left">
              <div className="text-[10px] leading-tight">Get it on</div>
              <div className="text-xs font-bold leading-tight">Google Play</div>
            </div>
          </a>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#FFE5D9] px-4 py-1 rounded-full text-sm font-semibold text-[#FF6B35] mb-4">
            Get in Touch
          </div>
          <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6">
            We&apos;d Love to <span className="text-[#FF6B35]">Hear From You</span>
          </h1>
          <p className="text-lg text-[#8B7E74] max-w-2xl mx-auto leading-relaxed">
            Have a question, suggestion, or feedback? We&apos;re here to help! Reach out to us and we&apos;ll get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* CONTACT FORM */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-lg p-8 lg:p-10"
          >
            <h2 className="text-2xl font-black mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all bg-white"
                >
                  <option value="">Select a subject</option>
                  <option value="support">Technical Support</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Report a Bug</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="feedback">General Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                >
                  <div className="text-green-600"><FaCheckCircle /></div>
                  <span>Thank you! Your message has been sent. We&apos;ll get back to you soon.</span>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                >
                  <div className="text-red-600"><FaTimesCircle /></div>
                  <span>Something went wrong. Please try again.</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full bg-[#FF6B35] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#FF5722] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </motion.div>

          {/* CONTACT INFO */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-black mb-6">Other Ways to Reach Us</h2>
              <p className="text-[#8B7E74] mb-8">
                Prefer a different method? We&apos;re available through multiple channels.
              </p>
            </div>

            <div className="space-y-6">
              <ContactCard
                icon={<div className="text-3xl text-[#FF6B35]"><FaEnvelope /></div>}
                title="Email Us"
                content="support@foodyapp.com"
                description="We typically respond within 24 hours"
              />
              <ContactCard
                icon={<div className="text-3xl text-[#FF6B35]"><FaComments /></div>}
                title="Live Chat"
                content="Available in-app"
                description="Get instant help from our support team"
              />
              <ContactCard
                icon={
                  <div className="flex flex-col gap-2">
                    <div className="text-2xl text-[#1877F2]"><FaFacebook /></div>
                    <div className="text-2xl text-[#E4405F]"><FaInstagram /></div>
                    <div className="text-2xl text-[#000000]"><FaTiktok /></div>
                  </div>
                }
                title="Social Media"
                content="@FoodyApp"
                description="Follow us for updates and cooking tips"
              />
              <ContactCard
                icon={<div className="text-3xl text-[#FF6B35]"><FaMobileAlt /></div>}
                title="In-App Support"
                content="Settings → Help & Support"
                description="Get help directly from the app"
              />
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mt-12">
              <h3 className="text-xl font-black mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <FAQItem
                  question="How do I report a bug?"
                  answer="Use the contact form above and select 'Report a Bug' as the subject. Include as many details as possible about the issue."
                />
                <FAQItem
                  question="Can I request a new feature?"
                  answer="Absolutely! Select 'Feature Request' in the contact form and describe what you'd like to see in Foody."
                />
                <FAQItem
                  question="How long does support take to respond?"
                  answer="We aim to respond to all inquiries within 24 hours during business days."
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2D241E] text-[#F9F7F2] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-[#FF6B35] text-white px-3 py-1 rounded-lg font-black text-lg">
                  Foody
                </div>
              </div>
              <p className="text-sm opacity-70 mb-4">
                A unified platform that connects foodies for sharing, learning, and more.
              </p>
              <div className="flex gap-3">
                <SocialIcon icon={<div className="text-xl"><FaFacebook /></div>} />
                <SocialIcon icon={<div className="text-xl"><FaTwitter /></div>} />
                <SocialIcon icon={<div className="text-xl"><FaInstagram /></div>} />
                <SocialIcon icon={<div className="text-xl"><FaLinkedin /></div>} />
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Menu</h4>
              <div className="space-y-2 text-sm opacity-70">
                <a href="/" className="block hover:opacity-100 cursor-pointer">Home</a>
                <a href="/#features" className="block hover:opacity-100 cursor-pointer">Features</a>
                <a href="/#services" className="block hover:opacity-100 cursor-pointer">Services</a>
                <a href="/contact" className="block hover:opacity-100 cursor-pointer">Contact</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <div className="space-y-2 text-sm opacity-70">
                <p className="hover:opacity-100 cursor-pointer">AI Recipe Import</p>
                <p className="hover:opacity-100 cursor-pointer">Photo Analysis</p>
                <p className="hover:opacity-100 cursor-pointer">Meal Planning</p>
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
            <p>© 2025 Foody. Recipes are for everyone.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:opacity-100">Privacy Policy</a>
              <a href="#" className="hover:opacity-100">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ContactCard({ icon, title, content, description }: { icon: string | React.ReactNode; title: string; content: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow p-6 border border-gray-100 flex items-center gap-4 justify-start"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-[#FF6B35] font-semibold mb-1">{content}</p>
          <p className="text-sm text-[#8B7E74]">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <h4 className="font-bold text-sm mb-2">{question}</h4>
      <p className="text-sm text-[#8B7E74]">{answer}</p>
    </div>
  )
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <a 
      href="#" 
      className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white"
    >
      {icon}
    </a>
  )
}

