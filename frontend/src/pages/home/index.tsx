import Categories from "@/features/categories";
import HeroSection from "@/features/hero/hero";
import FarmTestimonials from "@/features/members";
import ContactCTA from "@/features/newsletter";
import FarmFeatures from "@/features/offers";
import FarmDashboard from "@/features/products";
import SuccessStories from "@/features/testimonials";
import "./home.css";

export const Home = () => {
	return (
		<div className="px-1 md:px-4 my-0 md:my-4 h-full">
			<div className="hero-section">
				<HeroSection />
			</div>
			<div className="categories-section">
				<Categories />
			</div>
			<div className="dashboard-section">
				<FarmDashboard />
			</div>
			<div className="features-section">
				<FarmFeatures />
			</div>
			<div className="testimonials-section">
				<FarmTestimonials />
			</div>
			<div className="stories-section flex items-center justify-center">
				<SuccessStories />
			</div>
			<div className="contact-section">
				<ContactCTA />
			</div>
            <div className="flex justify-center mb-2">
                <p>VieFarm © 2024. All Rights Reserved</p>
            </div>
		</div>
	);
};
