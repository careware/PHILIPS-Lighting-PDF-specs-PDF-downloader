"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

// Version-specific URL templates
const URL_TEMPLATES = {
  v5: [
    "https://www.assets.signify.com/is/content/PhilipsLighting/fp{12NC}-pss-global",
    "https://www.lighting.philips.com/api/assets/v1/file/Signify/content/{12NC}_EU.en_AA.PROF.FP/Localized_commercial_leaflet_{12NC}_en_AA.pdf",
  ],
  v6: [
    "https://www.assets.signify.com/is/content/Signify/fp{12NC}-pss-global",
    "https://www.lighting.philips.com/api/assets/v1/file/PhilipsLighting/content/{12NC}_EU.en_AA.PROF.FP/Localized_commercial_leaflet_{12NC}_en_AA.pdf",
  ],
}

export default function PhilipsPDFDownloader() {
  const [twelvenc, setTwelvenc] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")

  const testUrl = async (url: string, retries = 3): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 5000, // 5 second timeout
        })
        const uint8Array = new Uint8Array(response.data)
        const pdfSignature = "%PDF"
        return pdfSignature === String.fromCharCode.apply(null, uint8Array.subarray(0, pdfSignature.length))
      } catch (err) {
        if (i === retries - 1) return false
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
      }
    }
    return false
  }

  const handleDownload = async () => {
    if (!twelvenc || twelvenc.length !== 12) {
      setError("Please enter a valid 12NC (12 digits)")
      return
    }

    setLoading(true)
    setError("")
    setDebugInfo("")

    let debugLog = ""

    // Try V5 URLs first
    debugLog += `Trying first URL...\n`
    for (const urlTemplate of URL_TEMPLATES.v5) {
      const url = urlTemplate.replace(/{12NC}/g, twelvenc)
      debugLog += `Trying URL: ${url}\n`

      try {
        const isPDF = await testUrl(url)
        if (!isPDF) {
          debugLog += `❌ PDF not found at this URL\n\n`
          continue
        }

        debugLog += `✅ PDF found! Downloading...\n`

        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000, // 10 second timeout for download
        })
        const blob = new Blob([response.data], { type: "application/pdf" })
        const fileName = `${twelvenc}_specification.pdf`

        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)

        debugLog += `✅ Download successful!\n`
        setDebugInfo(debugLog)
        setLoading(false)
        return
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        debugLog += `❌ Error: ${errorMessage}\n\n`
      }
    }

    // If V5 fails, try V6 URLs
    debugLog += `Trying second URL...\n`
    for (const urlTemplate of URL_TEMPLATES.v6) {
      const url = urlTemplate.replace(/{12NC}/g, twelvenc)
      debugLog += `Trying URL: ${url}\n`

      try {
        const isPDF = await testUrl(url)
        if (!isPDF) {
          debugLog += `❌ PDF not found at this URL\n\n`
          continue
        }

        debugLog += `✅ PDF found! Downloading...\n`

        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000,
        })
        const blob = new Blob([response.data], { type: "application/pdf" })
        const fileName = `${twelvenc}_specification.pdf`

        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)

        debugLog += `✅ Download successful!\n`
        setDebugInfo(debugLog)
        setLoading(false)
        return
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        debugLog += `❌ Error: ${errorMessage}\n\n`
      }
    }

    setError("Could not find the PDF. Please check the 12NC and try again.")
    setDebugInfo(debugLog)
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && twelvenc && twelvenc.length === 12) {
      handleDownload()
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-2">Philips PDF Downloader</h1>
      <p className="text-sm text-gray-600 mb-6">
        This tool allows you to download product specification PDFs for Philips Lighting products. Enter the 12NC
        (12-digit Numerical Code) of the product, and the app will search and retrieve the corresponding PDF from
        Philips' databases.
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter 12NC (12 digits)"
            value={twelvenc}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 12)
              setTwelvenc(value)
            }}
            onKeyPress={handleKeyPress}
            className="font-mono"
            maxLength={12}
          />
          <p className="text-xs text-gray-500">Example: 911401510832</p>
        </div>
        <Button onClick={handleDownload} disabled={loading || !twelvenc || twelvenc.length !== 12} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Downloading..." : "Download PDF"}
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {debugInfo && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <h2 className="text-lg font-semibold mb-2">Debug Information:</h2>
            <pre className="text-xs whitespace-pre-wrap font-mono">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

