import { usePlayerStore } from '../store/player'

export function DesktopLyrics() {
  const { currentSong, isPlaying } = usePlayerStore()
  
  // Request PiP permission
  const requestPiP = async () => {
    try {
      if (document.pictureInPictureEnabled) {
        // Create a video element for PiP
        const video = document.createElement('video')
        video.srcObject = new MediaStream()
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.log('PiP not supported:', err)
    }
  }
  
  if (!currentSong || !isPlaying) return null
  
  return (
    <div className="fixed bottom-24 right-4 z-40">
      <button
        onClick={requestPiP}
        className="w-12 h-12 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center text-accent hover:bg-accent/30"
      >
        📝
      </button>
    </div>
  )
}