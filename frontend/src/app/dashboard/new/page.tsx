"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewSubmissionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a prescription file (Image or PDF).");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("symptoms", symptoms);

    try {
      const token = getToken();
      const res = await fetch(`/api/submissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to analyze prescription");
      }

      router.push(`/dashboard/submission/${data.submission_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          &larr; Back to Dashboard
        </Link>
        <Card className="shadow-2xl border-0 ring-1 ring-black/5">
          <CardHeader className="bg-white rounded-t-xl border-b border-gray-100 pb-8 pt-8">
            <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">Analyze New Prescription</CardTitle>
            <CardDescription className="text-base text-gray-500 mt-2">Upload your prescription and describe any symptoms to get an AI-powered summary.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 bg-white/50">
            <form onSubmit={handleUpload} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="file" className="text-base font-semibold text-gray-800">Prescription File (JPG, PNG, PDF)</Label>
                <div className="relative">
                  <Input
                    id="file"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                    className="h-14 py-3 px-4 text-base rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="symptoms" className="text-base font-semibold text-gray-800">Symptoms or Health Notes (Optional)</Label>
                <Textarea
                  id="symptoms"
                  placeholder="e.g., I've been feeling dizzy in the mornings after eating..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={5}
                  className="text-base rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 p-4"
                />
              </div>
              
              {error && <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-sm font-medium text-red-600">{error}</p></div>}
              
              <Button type="submit" className="w-full h-16 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "AI is analyzing your prescription..." : "Analyze Prescription ✨"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
