import AppKit
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("usage: pdf_pages.swift <in.pdf> <out-dir> [dpi] [first-last]\n".data(using: .utf8)!)
  exit(2)
}
let outDir = URL(fileURLWithPath: args[2])
let dpi = args.count > 3 ? Double(args[3]) ?? 110 : 110
var first = 1
var last = doc.pageCount
if args.count > 4 {
  let parts = args[4].split(separator: "-").compactMap { Int($0) }
  if parts.count == 2 { first = parts[0]; last = min(parts[1], doc.pageCount) }
}
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
print("pages: \(doc.pageCount)")
for i in first...last {
  guard let page = doc.page(at: i - 1) else { continue }
  let box = page.bounds(for: .mediaBox)
  let scale = dpi / 72.0
  let size = NSSize(width: box.width * scale, height: box.height * scale)
  let image = page.thumbnail(of: size, for: .mediaBox)
  guard let tiff = image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
        let png = rep.representation(using: .png, properties: [:]) else { continue }
  let name = String(format: "page-%03d.png", i)
  try png.write(to: outDir.appendingPathComponent(name))
  print("\(name) \(Int(box.width))x\(Int(box.height))pt")
}
