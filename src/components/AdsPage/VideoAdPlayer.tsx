
import VideoControls from './VideoControls';

export default function VideoAdPlayer() {
  return (
    <div className="relative w-[380px] h-[640px] sm:w-[420px] sm:h-[700px] md:w-[480px] md:h-[720px] rounded-lg overflow-hidden bg-gray-900">
      <video
        src="/ads/ad1.mp4"
        autoPlay
        loop
        muted
        className="w-full h-full object-cover"
      />
      <VideoControls />
    </div>
  );
}
