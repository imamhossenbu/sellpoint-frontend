
import CategoriesGrid from "@/components/home/CategoriesGrid";
import FeaturedListings from "@/components/home/FeaturedListing";
import HomeHero from "@/components/home/HomeHero";
import HowItWorks from "@/components/home/HowItWorks";
import LatestBlog from "@/components/home/LatestBlog";
import QuickStats from "@/components/home/QuickStats";
import Testimonials from "@/components/home/Testimonials";


export default function HomePage() {
  return (
    <div className="space-y-10">
      <HomeHero />
      <CategoriesGrid />
      <FeaturedListings />
      <HowItWorks />
      <QuickStats />
      <Testimonials />
      <LatestBlog />
    </div>
  );
}
