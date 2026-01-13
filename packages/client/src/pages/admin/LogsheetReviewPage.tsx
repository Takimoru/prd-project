import { useQuery } from "@apollo/client";
import { GET_ALL_LOGSHEETS } from "../../graphql/logsheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function LogsheetReviewPage() {
  const { data, loading } = useQuery(GET_ALL_LOGSHEETS);
  const [searchTerm, setSearchTerm] = useState("");

  const logsheets = data?.allLogsheets || [];

  const filteredLogs = logsheets.filter((log: any) => 
    log.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.weekNumber?.includes(searchTerm) ||
    log.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logsheet Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Review and download weekly activity recaps from all teams.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Archive History</CardTitle>
              <CardDescription>
                A collection of all submitted logsheets.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team, week, or user..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold">{log.team?.name || "N/A"}</TableCell>
                    <TableCell>
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {log.weekNumber}
                        </span>
                    </TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{log.createdBy?.name || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={log.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No logsheets found.</p>
              {searchTerm && (
                 <Button 
                   variant="link" 
                   onClick={() => setSearchTerm("")}
                   className="mt-2 text-primary"
                 >
                    Clear search filters
                 </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
