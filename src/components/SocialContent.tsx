import React, { useState } from 'react';
import { 
  Megaphone, Target, Share2, Compass, MessageSquare, Copy, Check, 
  Sparkles, Globe, HeartPulse, ShieldCheck, ChevronRight, Award, 
  HelpCircle, RefreshCw, Send, CheckCircle2, ArrowRight,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Video, FileText
} from 'lucide-react';

type Step = 'setup' | 'results';

interface PostTemplate {
  id: string;
  channel: string;
  tone: string;
  content: string;
  hashtags: string;
  visualCue?: string; // Optional visual idea/graphic suggestion
  videoScript?: boolean; // If true, rendering structured video scripts
}

export default function SocialContent() {
  const [step, setStep] = useState<Step>('setup');
  const [goal, setGoal] = useState<string>('Onboard Patients & Residents');
  const [customGoal, setCustomGoal] = useState('');
  const [channels, setChannels] = useState<string[]>(['LinkedIn', 'Twitter/X', 'Facebook', 'Instagram', 'YouTube', 'TikTok']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Available goals
  const availableGoals = [
    { label: 'Onboard Patients & Residents', desc: 'Promote easy, secure digital health admissions.' },
    { label: 'Attract Medical Staff & Partners', desc: 'Highlight advanced, multi-lingual offline charting.' },
    { label: 'Demonstrate Security Compliance', desc: 'Build trust with strict data privacy protocols.' },
    { label: 'Feature High-Availability Offline Mode', desc: 'Assure uninterrupted service for 1.47M residents.' }
  ];

  // Available channels
  const availableChannels = [
    { name: 'LinkedIn', desc: 'Great for B2B clinical partners, healthcare executives, and technical audits.' },
    { name: 'Twitter/X', desc: 'Ideal for tech updates, fast public announcements, and digital health news.' },
    { name: 'Facebook', desc: 'Perfect for patient community engagement, health updates, and local group sharing.' },
    { name: 'Instagram', desc: 'Ideal for high-impact visual slides, doctor spotlights, and clinic guides.' },
    { name: 'YouTube', desc: 'Excellent for detailed video walkthroughs, system tutorials, and patient trust stories.' },
    { name: 'TikTok', desc: 'Great for short educational healthcare videos, nursing tips, and interactive scripts.' },
    { name: 'Local News / WhatsApp Groups', desc: 'Best for direct resident outreach, clinic updates, and health bulletins.' },
    { name: 'Medical Forums', desc: 'For sharing professional whitepapers and peer EHR integrations.' }
  ];

  const getChannelIcon = (name: string) => {
    switch (name) {
      case 'LinkedIn':
        return <Linkedin className="text-[#0077B5] w-4 h-4" />;
      case 'Twitter/X':
        return <Twitter className="text-[#1DA1F2] w-4 h-4" />;
      case 'Facebook':
        return <Facebook className="text-[#1877F2] w-4 h-4" />;
      case 'Instagram':
        return <Instagram className="text-[#E1306C] w-4 h-4" />;
      case 'YouTube':
        return <Youtube className="text-[#FF0000] w-4 h-4" />;
      case 'TikTok':
        return <Video className="text-[#EE1D52] w-4 h-4" />;
      case 'Local News / WhatsApp Groups':
        return <MessageSquare className="text-[#25D366] w-4 h-4" />;
      case 'Medical Forums':
        return <FileText className="text-purple-600 w-4 h-4" />;
      default:
        return <Share2 className="text-gray-500 w-4 h-4" />;
    }
  };

  // Simulated tailormade content based on goal and channels
  const [posts, setPosts] = useState<PostTemplate[]>([]);

  const handleToggleChannel = (channelName: string) => {
    if (channels.includes(channelName)) {
      setChannels(channels.filter(c => c !== channelName));
    } else {
      setChannels([...channels, channelName]);
    }
  };

  const handleGetStarted = () => {
    setGenerating(true);
    setTimeout(() => {
      // Build custom posts based on selected goal
      const activeGoal = customGoal.trim() || goal;
      const generatedPosts: PostTemplate[] = [];

      channels.forEach((chan, idx) => {
        let text = '';
        let hashtags = '';
        let tone = 'Professional & Informative';
        let visualCue = '';
        let videoScript = false;

        const isPatients = activeGoal.toLowerCase().includes('patient') || activeGoal.toLowerCase().includes('onboard');
        const isStaff = activeGoal.toLowerCase().includes('staff') || activeGoal.toLowerCase().includes('partner') || activeGoal.toLowerCase().includes('medical');
        const isSecurity = activeGoal.toLowerCase().includes('security') || activeGoal.toLowerCase().includes('compliance') || activeGoal.toLowerCase().includes('privacy');
        const isOffline = activeGoal.toLowerCase().includes('offline') || activeGoal.toLowerCase().includes('high-availability') || activeGoal.toLowerCase().includes('uninterrupted');

        if (chan === 'LinkedIn') {
          tone = 'Professional';
          if (isPatients) {
            text = `🏥 We are thrilled to introduce the newly updated ehr.generalhospital.org! Engineered for maximum digital integration, our paperless admission system ensures seamless clinical care for 4.47 million regional residents.\n\nFrom secure patient admissions to cloud-synchronized record keeping, we are redefining modern medical workflows in real-time. Join us in elevating patient-first healthcare.`;
          } else if (isStaff) {
            text = `👩‍⚕️ Clinicians & Health Tech Partners: Experience the future of medicine at ehr.generalhospital.org. Our newly launched EHR platform features intuitive multi-lingual charting, rapid pharmacy diagnostics, and an interface that cuts charting times by 35%.\n\nWe are actively hiring medical staff and expanding our clinical partnership channels. Visit the site to learn more about our operational standards.`;
          } else if (isSecurity) {
            text = `🔒 Patient privacy and data protection are fundamental clinical standards. That's why ehr.generalhospital.org runs on advanced role-based access controls and robust encryption architectures.\n\nWe guarantee diagnostic records remain fully confidential and strictly restricted to authorized providers, complying with strict regional security compliance audits.`;
          } else if (isOffline) {
            text = `⚡ Medical operations should never rely solely on unstable networks. At General Hospital, we've deployed an advanced offline-first synchronization engine to serve 1.47 million regional residents.\n\nOur system keeps medical staff productive with high-availability patient charts even during complete local connectivity blackouts, syncing securely once online.`;
          } else {
            text = `🏥 We have officially upgraded our operations at ehr.generalhospital.org! Our goal: ${activeGoal}.\n\nDesigned for maximum high-availability and zero-downtime offline stability, our paperless system ensures seamless clinical care.`;
          }
          hashtags = '#DigitalHealth #EHR #HealthcareInnovation #MedTech #PaperlessHospital';
        } 
        
        else if (chan === 'Twitter/X') {
          tone = 'Engaging & Direct';
          if (isPatients) {
            text = `Meet the next generation of healthcare: ehr.generalhospital.org! 🚀\n\n✅ 100% Paperless patient check-ins\n✅ Streamlined clinical registration\n✅ High security & multi-lingual support\n\nProviding robust, continuous care for 4.47M residents. Try it today!`;
          } else if (isStaff) {
            text = `Doctors, nurses, and medical practitioners: We're elevating patient care at ehr.generalhospital.org! 🩺💻\n\nReduce charting exhaustion with smart multi-lingual layouts, live diagnostics, and seamless lab integration. Check our clinical career openings!`;
          } else if (isSecurity) {
            text = `Your medical privacy is absolute. 🔒\n\nThe ehr.generalhospital.org platform features bank-grade encryption, strict role-based authorization, and continuous access logs.\n\nKeeping patient records safe, secure, and compliant.`;
          } else if (isOffline) {
            text = `Internet down? EHR is still UP! ⛈️💻\n\nOur state-of-the-art offline database ensures clinical charting never stops for our 1.47M residents, keeping medical logs uninterrupted and syncing immediately when online.`;
          } else {
            text = `Introducing ehr.generalhospital.org! 🚀\n\nOur goal: ${activeGoal}.\n\n✅ 100% Paperless workflows\n✅ High-availability offline charting\n✅ Absolute data security`;
          }
          hashtags = '#DigitalHealth #MedTech #EHR';
        } 
        
        else if (chan === 'Facebook') {
          tone = 'Warm & Informative';
          if (isPatients) {
            text = `🏥 **Exciting News for Our Community!** 🏥\n\nWe've upgraded our patient portal at ehr.generalhospital.org to make your clinic check-ins faster, safer, and 100% paperless!\n\nHere’s what this means for you and your family:\n⚡ **Fast Admissions**: Fill out paperwork online from your phone or computer before you arrive.\n🛡️ **Secure Access**: Your records are encrypted and protected by advanced data security.\n🌐 **Multilingual Support**: Available in multiple languages to serve everyone in our community.\n\nGetting medical care is now simpler than ever. Try logging in today and set up your secure profile!\n\n🔗 Visit: ehr.generalhospital.org`;
          } else if (isStaff) {
            text = `👩‍⚕️👨‍⚕️ **Calling All Healthcare Professionals & Clinical Partners!** 🏥\n\nGeneral Hospital is moving healthcare forward with our state-of-the-art Digital EHR platform at ehr.generalhospital.org.\n\nWe are looking for dedicated nurses, doctors, and specialists to join our digitally empowered clinical team. Why work with us?\n✅ **Smart Charting**: Streamlined layouts that reduce charting fatigue.\n✅ **Offline Resilience**: Never worry about losing data during network outages.\n✅ **Interoperable Systems**: Seamlessly sync laboratory and pharmacy records.\n\nDiscover how our medical tools help you focus on what matters most: your patients.\n\n🔗 Apply or Partner with us today at: ehr.generalhospital.org`;
          } else if (isSecurity) {
            text = `🔒 **Your Privacy Is Our Top Priority** 🔒\n\nAt General Hospital, we believe secure care starts with secure records. We are proud to share that our upgraded platform at ehr.generalhospital.org operates under the highest level of patient data privacy protocols.\n\nHow we keep your medical files safe:\n🔐 **End-to-End Encryption** for all digital admissions and diagnoses.\n👥 **Strict Role-Based Access**—only authorized doctors can see your charts.\n🖥️ **Local Compliance Audits** ensuring ISO and regional health privacy standards.\n\nRest easy knowing your health history is in safe, professional hands.\n\n🔗 Learn more about our privacy commitment at: ehr.generalhospital.org`;
          } else if (isOffline) {
            text = `⛈️ **Rain or Shine, Online or Offline – Your Care Never Stops** 🏥\n\nDuring regional network disruptions or power outages, our critical hospital databases don't skip a beat. General Hospital has launched an ultra-resilient Offline EHR system at ehr.generalhospital.org.\n\nWhy this is a game-changer for our 1.47M regional residents:\n🚀 **100% Continuous Care**: Doctors can access charts even if the local internet goes down.\n💾 **Safe Offline Persistence**: Diagnoses and prescriptions are safely stored offline and instantly synced when connectivity returns.\n⚡ **Zero Delays**: Shorter waiting times, even during severe weather.\n\nWe are committed to providing continuous, reliable healthcare, no matter the circumstances.\n\n🔗 Discover our offline-first technology at: ehr.generalhospital.org`;
          } else {
            text = `📢 **Platform Upgrade Announcement** 📢\n\nWe are thrilled to launch the new ehr.generalhospital.org! Our goal is to serve our community with a paperless, secure, and highly reliable clinical platform.\n\nWhether you are a patient looking for easy digital admissions, or a clinical partner analyzing our systems, we've built this for you. Check out our services today!\n\n🔗 Visit us to learn more: ehr.generalhospital.org`;
          }
          hashtags = '#CommunityHealth #DigitalEHR #PatientCare #HealthcareInnovation';
        } 
        
        else if (chan === 'Instagram') {
          tone = 'Visual & Informative';
          visualCue = 'A high-contrast Carousel Post (Slide 1: Clean phone displaying ehr.generalhospital.org check-in screen, Title: "No more clipboards." Slide 2: Security badges list. Slide 3: Simple steps to register. Background styled with General Hospital branding.)';
          
          if (isPatients) {
            text = `Clipboard fatigue is real! 📋❌ That's why we’ve upgraded our portal to let you complete your clinic check-ins right from your phone. \n\nNo more filling out the same paper forms every time you visit. It's fast, secure, and 100% digital.\n\n👉 Click the link in our bio to set up your pre-registration profile today! ehr.generalhospital.org`;
          } else if (isStaff) {
            text = `We are empowering our clinical staff with next-generation medical tools. Our updated EHR at ehr.generalhospital.org features multi-lingual charting, fast diagnostics sync, and absolute offline resilience.\n\nLess charting fatigue. Better patient outcomes.\n\n👉 We're hiring and partnering! Visit the link in our bio to join our digital-first healthcare team.`;
          } else if (isSecurity) {
            text = `Trust is the foundation of healthcare. 🔐 That's why our new digital platform at ehr.generalhospital.org utilizes medical-grade encryption and strict access audits to guard your health records.\n\nYour data is yours, secure and confidential.\n\n👉 Read our digital safety brief by clicking the link in our bio!`;
          } else if (isOffline) {
            text = `What happens to your health records if the internet goes down? At General Hospital, care never stops. ⚡\n\nOur upgraded platform at ehr.generalhospital.org is built with local offline databases, allowing clinical staff to chart, prescribe, and admit patients even during complete network outages.\n\n👉 Learn how our offline technology works—link in bio!`;
          } else {
            text = `We have officially upgraded our systems to ehr.generalhospital.org! 🚀\n\nBringing paperless, modern, and high-availability health workflows directly to our community.\n\n👉 Tap the link in our bio to explore our public services!`;
          }
          hashtags = '#EHRUpgrade #DigitalHealth #GeneralHospital #MedTechLife #SafetyFirst';
        } 
        
        else if (chan === 'YouTube') {
          tone = 'Production Outline & Description';
          videoScript = true;
          
          if (isPatients) {
            visualCue = 'Walkthrough video demonstrating how to use the portal in high definition with on-screen annotations.';
            text = `**PROPOSED TITLE**: How to Check In Online at General Hospital (Step-by-Step EHR Guide)

**VIDEO CHAPTER OUTLINE**:
⏱️ 0:00 - Introduction: The nightmare of traditional waiting room paperwork.
⏱️ 0:45 - Live Screen Walkthrough of logging in at ehr.generalhospital.org.
⏱️ 1:30 - How to quickly pre-fill your medical background.
⏱️ 2:15 - Security overview: How your personal records are fully encrypted.
⏱️ 3:00 - Live summary: Walking into the clinic and checking in via phone.

**VIDEO DESCRIPTION FIELD**:
No more waiting rooms with clipboards! In this quick tutorial, we walk you through our new patient portal at ehr.generalhospital.org.

Learn how to create your secure profile, pre-fill your medical history, and skip the queue during your next visit. Our portal is highly secure, multi-lingual, and designed for lightning-fast clinical intake.

🔗 Set up your portal now: ehr.generalhospital.org`;
          } else if (isStaff) {
            visualCue = 'Sleek, high-production b-roll of doctors using tablets in active clinic rooms with interface overlays.';
            text = `**PROPOSED TITLE**: Inside the Technology Driving General Hospital's EHR Workflows

**VIDEO CHAPTER OUTLINE**:
⏱️ 0:00 - Introduction: The heavy burden of traditional physician charting.
⏱️ 1:00 - Interface Demo: Keyboard shortcuts and multi-lingual charting.
⏱️ 2:15 - Instant Syncing: How laboratory and prescriptions update live.
⏱️ 3:30 - Work-Life Balance: How smart UI reduces nurse exhaustion.
⏱️ 4:45 - Partner & Developer API walkthrough.

**VIDEO DESCRIPTION FIELD**:
Are you a clinician, medical resident, or healthcare partner? Discover how ehr.generalhospital.org is leading regional digital transformation.

We display our clinical dashboard, auto-diagnostics assist, and how we cut average charting times. Watch to find out why top medical professionals are choosing General Hospital.

🔗 Clinical Careers & Partnerships: ehr.generalhospital.org`;
          } else if (isSecurity) {
            visualCue = 'Interviews with Lead Security Compliance Officer, background servers, and abstract encryption animations.';
            text = `**PROPOSED TITLE**: How We Protect Your Medical Records (EHR Security Protocols Explained)

**VIDEO CHAPTER OUTLINE**:
⏱️ 0:00 - Why medical records require advanced database protection.
⏱️ 1:10 - Demystifying end-to-end clinical encryption.
⏱️ 2:25 - Role-Based Access Controls (RBAC) in practice.
⏱️ 3:30 - Behind the scenes: Audit trails and system defense.
⏱️ 4:40 - Summary & Regulatory standard compliance check.

**VIDEO DESCRIPTION FIELD**:
Data privacy is a fundamental human right, especially in medical science. In this technical breakdown, our security team details the layers safeguarding ehr.generalhospital.org.

From secure cryptographic hashing to active authorization logs, see how we guard patient trust while keeping diagnostics fast and accurate for clinical teams.

🔗 Review our complete Security whitepaper: ehr.generalhospital.org`;
          } else if (isOffline) {
            visualCue = 'Engaging lab simulation: pulling the main fiber-optic cable and showing the EHR system continuing to save charts seamlessly.';
            text = `**PROPOSED TITLE**: Offline EHR: How General Hospital Defies Regional Network Outages

**VIDEO CHAPTER OUTLINE**:
⏱️ 0:00 - The core vulnerability of cloud-only systems during extreme weather.
⏱️ 1:15 - Outage Simulation: Pulling the internet connection on our devices.
⏱️ 2:30 - Live Demo: Nurses continuing to write diagnoses on offline databases.
⏱️ 3:45 - Automatic synchronization and conflict resolution when connection is restored.
⏱️ 5:00 - Scaling resilient health tech to 1.47 million regional residents.

**VIDEO DESCRIPTION FIELD**:
When power lines fall, critical clinical care shouldn't. Join our engineering team for a simulated stress-test of the General Hospital EHR platform at ehr.generalhospital.org.

Watch how our local databases continue to register patient metrics and display health histories with zero active internet, serving our region without a single second of downtime.

🔗 Read our technical engineering report: ehr.generalhospital.org`;
          } else {
            visualCue = 'Overview drone b-roll of General Hospital with computer overlays and interface snippets.';
            text = `**PROPOSED TITLE**: Introducing the New General Hospital EHR Portal

**VIDEO CHAPTER OUTLINE**:
⏱️ 0:00 - Overview of the new platform.
⏱️ 1:15 - Key features for residents, patients, and clinical partners.
⏱️ 2:30 - System tour and login options.
⏱️ 3:45 - Wrap up and future digital updates.

**VIDEO DESCRIPTION FIELD**:
Welcome to the official launch video of the General Hospital Electronic Health Records system!

We are thrilled to bring paperless, fast, and high-availability clinical tools to ehr.generalhospital.org.

🔗 Visit the official web portal: ehr.generalhospital.org`;
          }
          hashtags = '#EHRWalkthrough #MedTechVideo #GeneralHospital #TechLaunch';
        } 
        
        else if (chan === 'TikTok') {
          tone = 'Snappy Video Script & Concept';
          videoScript = true;
          visualCue = 'TikTok visual hook: Split-screen "Before vs. After" or high-energy point-of-view (POV) transition. Subtitles in large yellow font.';
          
          if (isPatients) {
            text = `**VIDEO BRIEF**: A fun, fast-paced "POV: You forgot to check in online" trend.
            
**SCENE 1 (0-10s)**:
[Visual: Person looking extremely frustrated, holding a floppy clipboard and a broken pen in a dark, clinical waiting room.]
[Audio/Music: Fast-paced ticking clock sound.]
[On-Screen Text]: "POV: Trying to check in at a clinic in 2010... same forms for the 50th time"

**SCENE 2 (10-25s)**:
[Visual: Transition with camera spin. Same person walking into General Hospital, smiling, holding a sleek phone displaying a beautiful check-in confirmation green screen.]
[Audio/Music: High-energy upbeat pop track hits.]
[On-Screen Text]: "Checking in at General Hospital today! 😎 No paper. No wait."
[Voiceover]: "Ditch the clipboard. Just log in at ehr.generalhospital.org, pre-register in under 2 minutes, and walk right in!"

**SCENE 3 (25-30s)**:
[Visual: Person tapping phone, green checkmark animation.]
[On-Screen Text]: "EHR: Fast, Paperless, Secure."`;
          } else if (isStaff) {
            text = `**VIDEO BRIEF**: A satisfying "Aesthetic Doctor Shift" transition highlighting modern tech tools.
            
**SCENE 1 (0-10s)**:
[Visual: Nurse or doctor in scrubs looking exhausted, carrying giant stacks of paper folders. Screen is dark.]
[On-Screen Text]: "When you spend 6 hours just on charting..."

**SCENE 2 (10-25s)**:
[Visual: Clean snap transition. The doctor snaps fingers and a beautiful digital tablet is in hand with the sleek ehr.generalhospital.org dashboard open. The room turns bright and modern.]
[Voiceover]: "Work at a place that values your time. Our new EHR layout has fast clinical templates, auto-saving, and multi-lingual support that reduces charting exhaustion. We are looking for talented clinicians to join us!"

**SCENE 3 (25-30s)**:
[Visual: Text overlay with careers page link: ehr.generalhospital.org/careers]
[On-Screen Text]: "We're Hiring! Work-life balance is real here 🩺✨"`;
          } else if (isSecurity) {
            text = `**VIDEO BRIEF**: "Tech-Vibe Check" showing security standards for hospital databases.
            
**SCENE 1 (0-10s)**:
[Visual: Dark room with glowing blue ambient light. Laptop showing active digital lock icons.]
[On-Screen Text]: "Are your hospital records actually secure?"

**SCENE 2 (10-25s)**:
[Visual: Pointing to encrypted data blocks on our secure developer console UI.]
[Voiceover]: "We take medical privacy seriously. Our upgraded platform at ehr.generalhospital.org uses advanced database encryption, strict role-based access, and local clinical server backups. If it isn't your authorized doctor, they can't see it. Period."

**SCENE 3 (25-30s)**:
[Visual: Green shield icon popping up on screen.]
[On-Screen Text]: "Your data. Fully Guarded. 🔒🏥"`;
          } else if (isOffline) {
            text = `**VIDEO BRIEF**: High-intensity weather simulation showing clinical tech resilience.
            
**SCENE 1 (0-10s)**:
[Visual: Rain hitting window violently, lights flicker and turn off. Standard clinic screen says: "Connection Failed - Retrying".]
[On-Screen Text]: "Internet down... Clinic frozen? 🛑"

**SCENE 2 (10-25s)**:
[Visual: Camera pans to General Hospital doctor. Lights are flickering but tablet is fully loaded with full charts and local database checks.]
[Voiceover]: "Not here. Our advanced offline-first database saves diagnoses and charts even with zero local internet connection. Everything syncs instantly once power returns! Continuous care for 1.47 million residents."

**SCENE 3 (25-30s)**:
[Visual: Tablet displaying "Offline Persistence Enabled - Safe" banner.]
[On-Screen Text]: "Zero downtime medical care. ⛈️💪"`;
          } else {
            text = `**VIDEO BRIEF**: Clean EHR platform launch teaser.
            
**SCENE 1 (0-15s)**:
[Visual: Fast-paced, beautiful aesthetic medical clips. Close ups of clinical tablets, secure gates, and friendly staff.]
[On-Screen Text]: "ehr.generalhospital.org is officially LIVE! 🚀"
[Voiceover]: "We just upgraded our clinical systems to a fully digital, paperless EHR. Secure, modern, and built with offline-first tech to protect your care."

**SCENE 2 (15-30s)**:
[Visual: Portal URL on screen with animated arrow pointing to bio link.]
[On-Screen Text]: "Tap the link in our bio to check it out!"`;
          }
          hashtags = '#TikTokDoctor #HospitalHacks #EHRUpgrade #MedTech #TokTikMedical';
        } 
        
        else if (chan === 'Local News / WhatsApp Groups') {
          tone = 'Community-Focused';
          text = `📢 **Local Community Announcement:**\n\nWe have officially upgraded our systems at ehr.generalhospital.org to a modern, secure Digital EHR platform! This means shorter waiting times, safer patient records, and efficient billing.\n\nYour medical files are securely saved under strict privacy standards. We are proud to serve our community with next-level care!`;
          hashtags = '#CommunityHealth #Gelemso #HealthcareUpdates';
        } 
        
        else {
          tone = 'Clinical & Scientific';
          text = `Case study: Accelerating local healthcare delivery via custom-tailored Electronic Health Records (EHR). By incorporating offline database persistence and multi-lingual medical interfaces, we successfully secure operational resilience across regional clinical centers.`;
          hashtags = '#EHR #ClinicalPractice #MedicalInformatics';
        }

        generatedPosts.push({
          id: `${chan.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`,
          channel: chan,
          tone,
          content: text,
          hashtags,
          visualCue,
          videoScript
        });
      });

      setPosts(generatedPosts);
      setGenerating(false);
      setStep('results');
    }, 1200);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header card with user's core marketing description */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm overflow-hidden relative" id="social-media-header">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl" id="megaphone-badge">
                <Megaphone size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-purple-600 block mb-0.5">
                  Social Content
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none">
                  Promote your app in minutes
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Get a custom social promotion plan and ready-to-post content tailored specifically to the General Hospital EHR. We've added comprehensive promotion support for Facebook, TikTok, YouTube, and Instagram.
            </p>
          </div>
          
          <button 
            id="btn-toggle-learn-more"
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="text-xs font-bold text-gray-500 hover:text-gray-950 flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>{showLearnMore ? 'Hide Help' : 'Learn more'}</span>
          </button>
        </div>

        {/* Learn More Expandable Pane */}
        {showLearnMore && (
          <div className="mt-6 border-t border-gray-150 pt-5 space-y-4 text-xs text-gray-600 leading-relaxed animate-fadeIn" id="learn-more-pane">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">Define Target Audiences</h4>
                <p>Pinpoint regional residents looking for secure diagnostic transparency, or state clinical evaluators examining offline database uptime.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">Schedule & Automate</h4>
                <p>Broadcast system achievements consistently. Frequent clinical updates build community trust and boost local hospital brand authority.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <h4 className="font-bold text-gray-900 mb-1">Privacy & Regulations</h4>
                <p>Never share protected health information (PHI) or personal patient names on social networks. Share functional upgrades only.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {step === 'setup' ? (
        <div className="space-y-8" id="social-setup-step">
          {/* STEP 1: Define what you want to achieve */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold font-mono">1</span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Define what you want to achieve</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select a primary objective for your social outreach campaign.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableGoals.map((g) => {
                const isSelected = goal === g.label && !customGoal;
                return (
                  <button
                    key={g.label}
                    onClick={() => {
                      setGoal(g.label);
                      setCustomGoal('');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                      isSelected 
                        ? 'border-purple-600 bg-purple-50/20 shadow-xs' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs sm:text-sm text-gray-950 block">{g.label}</span>
                      {isSelected && (
                        <span className="bg-purple-600 text-white rounded-full p-0.5 shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-1 leading-normal">{g.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom goal text input */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Or write a custom goal:</label>
              <input 
                type="text" 
                placeholder="Example: Announce new laboratory diagnostics automation to 12 surrounding clinics..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 text-gray-800"
              />
            </div>
          </div>

          {/* STEP 2: Pick the best channels for your app */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold font-mono">2</span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Pick the best channels for your app</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select the social media and professional channels where your audience resides.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableChannels.map((c) => {
                const isSelected = channels.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => handleToggleChannel(c.name)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/20' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/30'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(c.name)}
                        <span className="font-bold text-xs sm:text-sm text-gray-950 block">{c.name}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 leading-normal block">{c.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-sm text-gray-900">Step 3: Get tailored post ideas you can share right away</h3>
              <p className="text-xs text-gray-400">Generate instantly customizable clinical postings based on your selections.</p>
            </div>
            
            <button
              onClick={handleGetStarted}
              disabled={generating || channels.length === 0}
              className="w-full sm:w-auto shrink-0 bg-purple-950 hover:bg-purple-900 disabled:opacity-50 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>Analyzing App Meta...</span>
                </>
              ) : (
                <>
                  <span>Get started</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn" id="social-results-step">
          {/* RESULTS VIEW */}
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">Your Tailored Ready-To-Post Content</h3>
              <p className="text-xs text-gray-500">
                Campaign focus: <strong className="text-purple-700">{customGoal || goal}</strong>
              </p>
            </div>
            
            <button
              onClick={() => setStep('setup')}
              className="text-xs font-bold text-gray-600 hover:text-gray-950 bg-white border border-gray-200 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Start New Campaign
            </button>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col">
                {/* Header block for social channel info */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(post.channel)}
                    <span className="text-xs font-bold text-gray-900">{post.channel}</span>
                    <span className="text-gray-300 text-xs">|</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                      {post.tone}
                    </span>
                    {post.videoScript && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-100">
                        Video Script
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(post.id, `${post.content}\n\n${post.hashtags}`)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-950 transition-colors font-semibold cursor-pointer"
                  >
                    {copiedId === post.id ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="text-emerald-600 text-[11px]">Copied post!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Content text block with editing capability */}
                <div className="p-6 space-y-4">
                  {/* Visual suggestion box for Instagram/TikTok/YouTube */}
                  {post.visualCue && (
                    <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50 text-xs text-indigo-950">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                        <span>Visual Concept Idea:</span>
                      </div>
                      <p className="text-indigo-900 leading-relaxed italic">{post.visualCue}</p>
                    </div>
                  )}

                  <textarea 
                    value={post.content}
                    onChange={(e) => {
                      const updated = posts.map(p => p.id === post.id ? { ...p, content: e.target.value } : p);
                      setPosts(updated);
                    }}
                    rows={post.videoScript ? 10 : 6}
                    className="w-full text-xs sm:text-sm text-gray-700 font-sans leading-relaxed p-4 border border-gray-150 rounded-xl bg-gray-50/30 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                  />
                  
                  {/* Hashtags input block */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Tags:</span>
                    <input 
                      type="text" 
                      value={post.hashtags}
                      onChange={(e) => {
                        const updated = posts.map(p => p.id === post.id ? { ...p, hashtags: e.target.value } : p);
                        setPosts(updated);
                      }}
                      className="flex-1 text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50/50 rounded-lg border border-purple-100/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social Checklist / Recommendations */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4" id="social-checklist">
            <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-2">Outreach Execution Checklist</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-gray-600">
                  <strong>Create Engaging Visuals:</strong> For <strong>Instagram</strong> and <strong>Facebook</strong>, use real clinic photographs or simple typographic graphics matching the visual templates we provided.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-gray-600">
                  <strong>Record Short Clips:</strong> For <strong>TikTok</strong> and <strong>YouTube Shorts</strong>, use a clinical staff member to shoot natural, portrait-oriented walkthroughs of the EHR dashboard.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-gray-600">
                  <strong>Link in Bio:</strong> Direct users cleanly to the login portal <strong className="text-indigo-600">ehr.generalhospital.org</strong> by keeping a secure link on your main social profiles.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-gray-600">
                  <strong>Patient Anonymity:</strong> Strictly guard HIPAA and clinical standards; never capture actual patient names or confidential charts in promotional videos or graphics.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
