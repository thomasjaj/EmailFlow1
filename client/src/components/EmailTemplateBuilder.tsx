import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, Save, Palette, Type, Image, Link } from "lucide-react";

interface EmailTemplateBuilderProps {
  value: string;
  onChange: (html: string, text?: string) => void;
}

export default function EmailTemplateBuilder({ value, onChange }: EmailTemplateBuilderProps) {
  const [activeTab, setActiveTab] = useState("visual");
  const [textContent, setTextContent] = useState("");

  const handleHtmlChange = (html: string) => {
    onChange(html, textContent);
  };

  const handleTextChange = (text: string) => {
    setTextContent(text);
    onChange(value, text);
  };

  const insertTemplate = (template: string) => {
    onChange(template, "");
  };

  const basicTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #3B82F6; color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #333; font-size: 24px; }
        p { line-height: 1.6; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Our Newsletter</h1>
        </div>
        <div class="content">
            <h2>Hello there!</h2>
            <p>Thank you for subscribing to our newsletter. We're excited to share amazing content with you.</p>
            <p>Stay tuned for updates, tips, and exclusive offers.</p>
            <a href="#" class="button">Get Started</a>
            <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
            <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>
  `.trim();

  const promotionalTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Special Offer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; text-align: center; }
        .offer { background-color: #f8f9fa; padding: 30px; margin: 20px 0; border-radius: 8px; border: 2px dashed #3B82F6; }
        .cta-button { display: inline-block; padding: 15px 30px; background-color: #10B981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        h1 { margin: 0; font-size: 32px; }
        .discount { font-size: 48px; color: #3B82F6; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Special Offer Just for You!</h1>
        </div>
        <div class="content">
            <div class="offer">
                <div class="discount">50% OFF</div>
                <h2>Limited Time Offer</h2>
                <p>Don't miss out on this incredible deal. Save big on all our premium products.</p>
                <p><strong>Use code: SAVE50</strong></p>
            </div>
            <a href="#" class="cta-button">Shop Now</a>
            <p>Offer expires in 48 hours. Terms and conditions apply.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Your Company. All rights reserved.</p>
            <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>
  `.trim();

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-300 bg-slate-50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => insertTemplate(basicTemplate)}>
            <Palette className="h-4 w-4 mr-1" />
            Basic Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => insertTemplate(promotionalTemplate)}>
            <Type className="h-4 w-4 mr-1" />
            Promotional
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="visual" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[400px]">
            {/* Toolbar */}
            <div className="border-r border-slate-200 p-4 bg-slate-50">
              <h3 className="font-medium text-slate-900 mb-3">Elements</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Type className="h-4 w-4 mr-2" />
                  Text Block
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Link className="h-4 w-4 mr-2" />
                  Button
                </Button>
              </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 p-4">
              {value ? (
                <div className="border rounded p-4 bg-white min-h-[350px]">
                  <div 
                    dangerouslySetInnerHTML={{ __html: value }}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center min-h-[350px] flex items-center justify-center">
                  <div>
                    <Palette className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">Drag and drop elements here or choose a template</p>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => insertTemplate(basicTemplate)}>
                        Basic Template
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => insertTemplate(promotionalTemplate)}>
                        Promotional Template
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[400px]">
            {/* HTML Editor */}
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">HTML Content</label>
                <Textarea
                  value={value}
                  onChange={(e) => handleHtmlChange(e.target.value)}
                  placeholder="Enter your HTML content here..."
                  className="min-h-[350px] font-mono text-sm"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border-l border-slate-200 p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Preview</label>
                <div className="border rounded p-4 bg-white min-h-[350px] overflow-auto">
                  {value ? (
                    <div dangerouslySetInnerHTML={{ __html: value }} />
                  ) : (
                    <div className="text-slate-400 text-center py-16">
                      HTML preview will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Text Version */}
          <div className="border-t border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Text Version (optional)</label>
            <Textarea
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter plain text version for email clients that don't support HTML..."
              className="min-h-[100px]"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
