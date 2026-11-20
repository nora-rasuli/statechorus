import AppKit
import Foundation

guard CommandLine.arguments.count == 4 else {
  fputs("Usage: create-social-preview.swift PRODUCT_INTRO RESULT OUTPUT\n", stderr)
  exit(64)
}

func loadCGImage(_ path: String) -> CGImage {
  guard
    let image = NSImage(contentsOfFile: path),
    let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
  else {
    fputs("Unable to load image: \(path)\n", stderr)
    exit(66)
  }
  return cgImage
}

let productIntro = loadCGImage(CommandLine.arguments[1])
let result = loadCGImage(CommandLine.arguments[2])

guard productIntro.width == 1280, productIntro.height == 470 else {
  fputs("Product intro component must be 1280x470.\n", stderr)
  exit(65)
}
guard result.width == 1280, result.height == 170 else {
  fputs("Result component must be 1280x170.\n", stderr)
  exit(65)
}

let width = 1280
let height = 640
let colorSpace = CGColorSpaceCreateDeviceRGB()
guard
  let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )
else {
  fputs("Unable to create output context.\n", stderr)
  exit(70)
}

context.setFillColor(NSColor(calibratedRed: 0.97, green: 0.96, blue: 0.93, alpha: 1).cgColor)
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
context.interpolationQuality = .none
context.draw(result, in: CGRect(x: 0, y: 0, width: 1280, height: 170))
context.draw(productIntro, in: CGRect(x: 0, y: 170, width: 1280, height: 470))

guard let output = context.makeImage() else {
  fputs("Unable to render social preview.\n", stderr)
  exit(70)
}

let bitmap = NSBitmapImageRep(cgImage: output)
guard let png = bitmap.representation(using: .png, properties: [:]) else {
  fputs("Unable to encode social preview.\n", stderr)
  exit(70)
}

try png.write(to: URL(fileURLWithPath: CommandLine.arguments[3]), options: .atomic)
