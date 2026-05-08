"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface Submission {
  id: number;
  symptoms: string;
  ai_response: {
    medicines?: any[];
    dosage_schedule?: string[];
    doctor_advice?: string[];
    lifestyle_changes?: string[];
    disclaimer?: string;
  };
  created_at: string;
}

export default function SubmissionDetailsPage() {
  const params = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSubmission = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      if (!params?.id) return;

      try {
        const res = await fetch(`/api/submissions/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSubmission(data);
        }
      } catch (err) {
        console.error("Failed to fetch submission", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [params.id, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading analysis...</div>;
  if (!submission) return <div className="min-h-screen flex items-center justify-center">Submission not found.</div>;

  const { ai_response } = submission;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900">Analysis #{submission.id}</h1>
        <p className="text-gray-500">Analyzed on {new Date(submission.created_at).toLocaleString()}</p>

        {ai_response?.disclaimer && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <p className="text-sm text-yellow-700 font-bold">⚠️ {ai_response.disclaimer}</p>
          </div>
        )}

        {submission.symptoms && (
          <Card>
            <CardHeader className="bg-gray-100 rounded-t-lg">
              <CardTitle className="text-lg">Your Notes / Symptoms</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-700">{submission.symptoms}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
              <CardTitle className="text-xl text-blue-800">💊 Prescribed Medicines</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ai_response?.medicines && ai_response.medicines.length > 0 ? (
                <ul className="space-y-4">
                  {ai_response.medicines.map((med, idx) => (
                    <li key={idx} className="bg-white border rounded-md p-3 shadow-sm">
                      <p className="font-bold text-lg text-gray-800">{med.name}</p>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                        <p><span className="font-semibold">Dosage:</span> {med.dosage}</p>
                        <p><span className="font-semibold">Frequency:</span> {med.frequency}</p>
                        <p className="col-span-2"><span className="font-semibold">Duration:</span> {med.duration}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No medicines identified.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-green-50 rounded-t-lg border-b border-green-100">
              <CardTitle className="text-xl text-green-800">📅 Dosage Schedule</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ai_response?.dosage_schedule && ai_response.dosage_schedule.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {ai_response.dosage_schedule.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No schedule provided.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-purple-50 rounded-t-lg border-b border-purple-100">
              <CardTitle className="text-xl text-purple-800">👨‍⚕️ Doctor's Advice</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ai_response?.doctor_advice && ai_response.doctor_advice.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {ai_response.doctor_advice.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No specific advice identified.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-orange-50 rounded-t-lg border-b border-orange-100">
              <CardTitle className="text-xl text-orange-800">🏃 Lifestyle Changes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ai_response?.lifestyle_changes && ai_response.lifestyle_changes.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {ai_response.lifestyle_changes.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No lifestyle changes suggested.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
