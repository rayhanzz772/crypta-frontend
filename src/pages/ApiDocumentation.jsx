import { useState } from 'react';
import {
  Code,
  Book,
  Key,
  Lock,
  FileText,
  Shield,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ApiDocumentation = () => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    passwords: false,
    notes: false,
    categories: false
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CodeBlock = ({ code, language = 'javascript', id }) => (
    <div className="relative group">
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        title="Copy code"
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4 text-foreground" />
        )}
      </button>
      <pre className="bg-muted text-foreground rounded-xl p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );

  const EndpointSection = ({ method, path, description, children }) => (
    <div className="border border-border rounded-xl p-6 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-primary' :
            method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-success' :
              method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-destructive/10 text-destructive'
          }`}>
          {method}
        </span>
        <div className="flex-1">
          <code className="text-lg font-mono text-foreground">{path}</code>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/developer')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Developer Keys
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                API Documentation
              </h1>
              <p className="text-muted-foreground">
                Complete guide to Secret Manager API
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Quick Start
            </h2>
            <p className="text-foreground mb-4">
              All API requests require authentication using your API key in the Authorization header:
            </p>
            <CodeBlock
              id="auth-header"
              code={`Authorization: Bearer YOUR_API_KEY`}
            />
            <p className="text-sm text-muted-foreground mt-3">
              Base URL: <code className="px-2 py-1 bg-card rounded">https://your-domain.com/public-api</code>
            </p>
          </div>
        </div>

        {/* Passwords Section */}
        <div className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <button
            onClick={() => toggleSection('passwords')}
            className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-2xl"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Passwords</h2>
            </div>
            {expandedSections.passwords ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {expandedSections.passwords && (
            <div className="p-6 pt-0 border-t border-border">
              <EndpointSection
                method="GET"
                path="/public-api/vault"
                description="Get all passwords in your vault"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Query Parameters</h4>
                  <div className="bg-muted/50 dark:bg-background rounded-lg p-4 space-y-2">
                    <p className="text-sm text-foreground">
                      <code className="font-mono">category_id</code> (optional) - Filter by category ID
                    </p>
                    <p className="text-sm text-foreground">
                      <code className="font-mono">search</code> (optional) - Search by name or username
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="get-passwords-response"
                    language="json"
                    code={`{
  "success": true,
  "data": [
    {
        "id": "cmho9ss44000im75sg3oy1xx5",
        "name": "BBNU",
        "username": "Buster@gmail.com",
        "note": "",
        "created_at": "2025/11/07",
        "updated_at": "2025/11/07",
        "category_name": "Game",
        "is_favorite": true
    },
  ]
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="POST"
                path="/public-api/vault"
                description="Create a new password entry"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    id="create-password-request"
                    language="json"
                    code={`{
  "name": "GitHub",
  "username": "user@example.com",
  "category_name": "cat123",
  "encrypted_notes": "Development account",
  "is_favorite": false
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="create-password-response"
                    language="json"
                    code={`{
  "success": true,
  "message": "Password created successfully",
  "data": {
    "id": "abc123",
    "name": "GitHub",
    ...
  }
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="PUT"
                path="/public-api/vault/:id"
                description="Update an existing password"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    id="update-password-request"
                    language="json"
                    code={`{
  "name": "GitHub Updated",
  "username": "newuser@example.com",
  "password_encrypted": "base64_encrypted_password",
  "url": "https://github.com",
  "category_id": "cat123",
  "note": "Updated notes"
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="DELETE"
                path="/public-api/vault/:id"
                description="Delete a password entry"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="delete-password-response"
                    language="json"
                    code={`{
  "success": true,
  "message": "Password deleted successfully"
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="POST"
                path="/public-api/vault/:id/decrypt"
                description="Decrypt a password"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    id="decrypt-password-request"
                    language="json"
                    code={`{
  "master_password": "your_master_password"
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="decrypt-password-response"
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "decrypted_password": "plain_text_password"
  }
}`}
                  />
                </div>
              </EndpointSection>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <button
            onClick={() => toggleSection('notes')}
            className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-2xl"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Secret Notes</h2>
            </div>
            {expandedSections.notes ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {expandedSections.notes && (
            <div className="p-6 pt-0 border-t border-border">
              <EndpointSection
                method="GET"
                path="/public-api/notes"
                description="Get all secret notes"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Query Parameters</h4>
                  <div className="bg-muted/50 dark:bg-background rounded-lg p-4 space-y-2">
                    <p className="text-sm text-foreground">
                      <code className="font-mono">category_id</code> (optional) - Filter by category ID
                    </p>
                    <p className="text-sm text-foreground">
                      <code className="font-mono">search</code> (optional) - Search by title
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="get-notes-response"
                    language="json"
                    code={`{
  "success": true,
  "data": [
    {
        "id": "cmhrkobyk000uo15s6nk01ie8",
        "title": "PIN",
        "category_name": "Finance",
        "created_at": "2025-11-09T10:30:24.141Z",
        "updated_at": "2025-11-09T10:30:24.141Z",
        "tags": [
            "work"
        ],
        "is_favorite": false
    },
  ]
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="POST"
                path="/public-api/notes"
                description="Create a new secret note"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    id="create-note-request"
                    language="json"
                    code={`{
    "title": "Link J",
    "note": "https://j.com",
    "category_id": "cmhrdgo2u0000dg5sdz525x7s",
    "tags": ["bok", "nganu"],
    "master_password": "Password123!"
}`
}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="GET"
                path="/public-api/notes/:id"
                description="Get a specific note"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="get-note-response"
                    language="json"
                    code={`{
    "id": "cmhrkobyk000uo15s6nk01ie8",
    "title": "PIN",
    "category_name": "Finance",
    "created_at": "2025-11-09T10:30:24.141Z",
    "updated_at": "2025-11-09T10:30:24.141Z",
    "tags": [
        "work"
    ],
    "is_favorite": false
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="PUT"
                path="/public-api/notes/:id"
                description="Update a secret note"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    id="update-note-request"
                    language="json"
                    code={`{
  "title": "Updated Meeting Notes",
  "encrypted_content": "base64_encrypted_content",
  "category_id": "cat123",
  "tags": ["meeting", "Q1", "important"]
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="DELETE"
                path="/public-api/notes/:id"
                description="Delete a secret note"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="delete-note-response"
                    language="json"
                    code={`{
  "success": true,
  "message": "Note deleted successfully"
}`}
                  />
                </div>
              </EndpointSection>

              <EndpointSection
                method="POST"
                path="/public-api/notes/:id/decrypt"
                description="Decrypt a note"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Request Body</h4>
                  <CodeBlock
                    id="decrypt-note-request"
                    language="json"
                    code={`{
  "master_password": "your_master_password"
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="decrypt-note-response"
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "decrypted_content": "plain_text_content"
  }
}`}
                  />
                </div>
              </EndpointSection>
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-2xl"
          >
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Categories</h2>
            </div>
            {expandedSections.categories ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {expandedSections.categories && (
            <div className="p-6 pt-0 border-t border-border">
              <EndpointSection
                method="GET"
                path="/public-api/categories"
                description="Get all available categories"
              >
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Response</h4>
                  <CodeBlock
                    id="get-categories-response"
                    language="json"
                    code={`{
  "success": true,
  "data": [
    {
      "id": "cat123",
      "name": "Work",
      "icon": "briefcase",
      "color": "blue"
    },
    {
      "id": "cat456",
      "name": "Personal",
      "icon": "user",
      "color": "green"
    }
  ]
}`}
                  />
                </div>
              </EndpointSection>
            </div>
          )}
        </div>

        {/* Error Responses */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Error Responses</h2>
          <p className="text-muted-foreground mb-4">
            All endpoints may return the following error responses:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">401 Unauthorized</h4>
              <CodeBlock
                id="error-401"
                language="json"
                code={`{
  "success": false,
  "message": "Invalid or missing API key"
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">404 Not Found</h4>
              <CodeBlock
                id="error-404"
                language="json"
                code={`{
  "success": false,
  "message": "Resource not found"
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">429 Too Many Requests</h4>
              <CodeBlock
                id="error-429"
                language="json"
                code={`{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">500 Internal Server Error</h4>
              <CodeBlock
                id="error-500"
                language="json"
                code={`{
  "success": false,
  "message": "An unexpected error occurred"
}`}
              />
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Code Examples</h2>

          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3">JavaScript / Node.js</h3>
            <CodeBlock
              id="example-js"
              language="javascript"
              code={`const axios = require('axios');

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://your-domain.com/api';

// Get all passwords
async function getPasswords() {
  try {
    const response = await axios.get(\`\${BASE_URL}/vault\`, {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
  }
}

// Create a new note
async function createNote(title, encryptedContent, categoryId, tags) {
  try {
    const response = await axios.post(\`\${BASE_URL}/notes\`, {
      title,
      encrypted_content: encryptedContent,
      category_id: categoryId,
      tags
    }, {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
  }
}

getPasswords();`}
            />
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3">Python</h3>
            <CodeBlock
              id="example-python"
              language="python"
              code={`import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://your-domain.com/api'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Get all passwords
def get_passwords():
    response = requests.get(f'{BASE_URL}/vault', headers=headers)
    if response.status_code == 200:
        data = response.json()
        print('Passwords:', data['data'])
    else:
        print('Error:', response.json())

# Create a new note
def create_note(title, encrypted_content, category_id, tags):
    payload = {
        'title': title,
        'encrypted_content': encrypted_content,
        'category_id': category_id,
        'tags': tags
    }
    
    response = requests.post(f'{BASE_URL}/notes', json=payload, headers=headers)
    if response.status_code == 201:
        data = response.json()
        print('Note created:', data['data'])
    else:
        print('Error:', response.json())

get_passwords()`}
            />
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">cURL</h3>
            <CodeBlock
              id="example-curl"
              language="bash"
              code={`# Get all passwords
curl -X GET "https://your-domain.com/public-api/vault" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -H "Content-Type: application/json"

# Create a new note
curl -X POST "https://your-domain.com/public-api/notes" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My Secret Note",
    "encrypted_content": "base64_encrypted_content",
    "category_id": "cat123",
    "tags": ["important", "work"]
  }'

# Delete a password
curl -X DELETE "https://your-domain.com/public-api/vault/abc123" \\
  -H "Authorization: Bearer your_api_key_here"`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="mb-2">Need help? Have questions?</p>
          <p className="text-sm">Contact support or check our community forum</p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
