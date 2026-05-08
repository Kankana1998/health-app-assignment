"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, removeToken } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Submission {
  id: number;
  symptoms: string;
  ai_response: {
    medicines?: any[];
    dosage_schedule?: string[];
    doctor_advice?: string[];
    lifestyle_changes?: string[];
  };
  created_at: string;
}

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSubmissions = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`/api/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (err) {
        console.error("Failed to fetch submissions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <div className="space-x-4">
            <Link href="/dashboard/new">
              <Button>New Analysis</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {loading ? (
          <p>Loading your health history...</p>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
              <p className="text-gray-500">No prescriptions analyzed yet.</p>
              <Link href="/dashboard/new">
                <Button variant="secondary">Upload your first prescription</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {submissions.map((sub) => (
              <Card key={sub.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between">
                    <span>Submission #{sub.id}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sub.symptoms && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700">Symptoms:</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{sub.symptoms}</p>
                    </div>
                  )}
                  {sub.ai_response?.medicines && sub.ai_response.medicines.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700">Medicines Prescribed:</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sub.ai_response.medicines.slice(0, 3).map((med, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {med.name}
                          </span>
                        ))}
                        {sub.ai_response.medicines.length > 3 && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            +{sub.ai_response.medicines.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <Link href={`/dashboard/submission/${sub.id}`}>
                    <Button variant="link" className="px-0 w-full justify-start text-blue-600">View Full Analysis &rarr;</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
