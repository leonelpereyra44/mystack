import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>

      {/* Schedule form */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-5 w-4" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
