import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import EmailTemplateBuilder from "@/components/EmailTemplateBuilder";
import { 
  Plus, 
  Search, 
  FileText,
  Copy,
  Edit,
  Trash,
  Eye,
  Download,
  Star
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    isDefault: false,
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/templates'],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/templates', templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setShowCreateTemplate(false);
      setNewTemplate({
        name: "",
        subject: "",
        htmlContent: "",
        textContent: "",
        isDefault: false,
      });
      toast({
        title: "Template created successfully",
        description: "Your email template is ready to use.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error creating template",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.htmlContent) {
      toast({
        title: "Missing required fields",
        description: "Please fill in template name, subject, and content.",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate(newTemplate);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    setNewTemplate({
      name: `${template.name} (Copy)`,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      isDefault: false,
    });
    setShowCreateTemplate(true);
  };

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Email Templates</h1>
            <p className="text-slate-600 mt-1">Create and manage reusable email templates.</p>
          </div>
        </div>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Email Templates</h1>
          <p className="text-slate-600 mt-1">Create and manage reusable email templates.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name*</Label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateSubject">Subject Line*</Label>
                    <Input
                      id="templateSubject"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email Content*</Label>
                  <div className="mt-2">
                    <EmailTemplateBuilder
                      value={newTemplate.htmlContent}
                      onChange={(html, text) => setNewTemplate(prev => ({ 
                        ...prev, 
                        htmlContent: html,
                        textContent: text || ''
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newTemplate.isDefault}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="isDefault" className="text-sm">Set as default template</Label>
                  </div>
                  <div className="space-x-3">
                    <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Total Templates</p>
                <p className="text-2xl font-semibold text-slate-900">{templates?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Default Templates</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {templates?.filter(t => t.isDefault).length || 0}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">Recently Updated</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {templates?.filter(t => {
                    const daysSinceUpdate = Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                    return daysSinceUpdate <= 7;
                  }).length || 0}
                </p>
              </div>
              <Edit className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.subject}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded border min-h-[100px] max-h-[100px] overflow-hidden">
                    <div 
                      className="text-xs text-slate-600 scale-50 origin-top-left w-[200%] h-[200%]"
                      dangerouslySetInnerHTML={{ __html: template.htmlContent }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No templates found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery 
                ? "Try adjusting your search query." 
                : "Create your first email template to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateTemplate(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm text-slate-600">Subject: {previewTemplate.subject}</p>
              </div>
              <div 
                className="border rounded-lg p-4 bg-white min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
