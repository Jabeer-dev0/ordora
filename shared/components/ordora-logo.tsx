import Image from "next/image"

export function OrdoraLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/ordora-logo.jpg"
      alt="Ordora"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  )
}
