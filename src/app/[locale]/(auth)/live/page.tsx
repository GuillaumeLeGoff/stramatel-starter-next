import { LiveSlideViewer } from "@/features/panel";

export default function LivePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <LiveSlideViewer />
      </div>
    </div>
  );
} 