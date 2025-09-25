// src/components/expenses/ExpenseManagementSkeleton.tsx

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ExpenseManagementSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-6 w-24 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
             </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};