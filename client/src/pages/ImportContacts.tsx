import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, Users, AlertTriangle, CheckCircle, X } from "lucide-react";
import type { ContactList } from "@shared/schema";

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export default function ImportContacts() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [createNewList, setCreateNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactLists = [] } = useQuery<ContactList[]>({
    queryKey: ["/api/contact-lists"],
  });

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsImporting(true);
      setImportProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      try {
        const result = await apiRequest("POST", "/api/contacts/import", formData, {
          headers: {
            // Don't set Content-Type, let the browser set it with boundary for FormData
          },
        });
        clearInterval(progressInterval);
        setImportProgress(100);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setIsImporting(false);
      }
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successful} contacts`,
      });
      // Reset form
      setSelectedFile(null);
      setSelectedListId("");
      setCreateNewList(false);
      setNewListName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    if (!createNewList && !selectedListId) {
      toast({
        title: "No List Selected",
        description: "Please select a contact list or create a new one",
        variant: "destructive",
      });
      return;
    }

    if (createNewList && !newListName.trim()) {
      toast({
        title: "List Name Required",
        description: "Please enter a name for the new contact list",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('listId', selectedListId);
    formData.append('createNewList', createNewList.toString());
    formData.append('newListName', newListName);

    importMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    const csvContent = "email,first_name,last_name,tags\nexample@email.com,John,Doe,newsletter\nexample2@email.com,Jane,Smith,\"newsletter,vip\"";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'contact_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Contacts</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file to bulk import your contacts into your lists.
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Required column: <code className="bg-muted px-1 rounded">email</code></li>
                <li>Optional columns: <code className="bg-muted px-1 rounded">first_name</code>, <code className="bg-muted px-1 rounded">last_name</code>, <code className="bg-muted px-1 rounded">tags</code></li>
                <li>For multiple tags, separate with commas and wrap in quotes: "tag1,tag2,tag3"</li>
                <li>Maximum file size: 10MB</li>
                <li>Maximum contacts per import: 50,000</li>
              </ul>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Select CSV File</label>
            <div className="flex items-center space-x-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Badge variant="secondary" className="flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  {selectedFile.name}
                </Badge>
              )}
            </div>
          </div>

          {/* List Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Contact List</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-new-list"
                  checked={createNewList}
                  onCheckedChange={(checked) => setCreateNewList(checked === true)}
                />
                <label htmlFor="create-new-list" className="text-sm">
                  Create new contact list
                </label>
              </div>
              
              {createNewList ? (
                <Input
                  placeholder="Enter new list name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              ) : (
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing list" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing contacts...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting || !selectedFile}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Import Errors:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-muted-foreground">
                        ...and {importResult.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={() => setImportResult(null)}
              className="mt-4"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}