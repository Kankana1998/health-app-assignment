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
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Analyze New Prescription</CardTitle>
            <CardDescription>Upload your prescription and describe any symptoms to get an AI-powered summary.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">Prescription File (JPG, PNG, PDF)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms or Health Notes (Optional)</Label>
                <Textarea
                  id="symptoms"
                  placeholder="e.g., I've been feeling dizzy in the mornings..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                />
              </div>
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "AI is analyzing your prescription..." : "Analyze Prescription"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
