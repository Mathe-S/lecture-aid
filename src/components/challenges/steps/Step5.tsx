/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Lock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { UserData, ChallengeProgress } from "../types";
import { copyToClipboard } from "../utils/clipboard";
import { useState, useEffect } from "react";

interface Step5Props {
  userData: UserData;
  progress: ChallengeProgress;
  cipherInput: string;
  keyInput: string;
  hashInput: string;
  snippetInput: string;
  onCipherInputChange: (value: string) => void;
  onKeyInputChange: (value: string) => void;
  onHashInputChange: (value: string) => void;
  onSnippetInputChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  showHint: boolean;
  onToggleHint: () => void;
}

export function Step5({
  userData,
  progress,
  cipherInput,
  keyInput,
  hashInput,
  snippetInput,
  onCipherInputChange,
  onKeyInputChange,
  onHashInputChange,
  onSnippetInputChange,
  onSubmit,
  loading,
  error,
  showHint,
  onToggleHint,
}: Step5Props) {
  const isCompleted = progress.completedSteps.includes(5);
  const isActive = progress.currentStep === 5;
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Generate complex encrypted data for this user
  const secretMessage = `MASTER_KEY_${userData.userHash}_VERIFIED`;

  // Caesar cipher with user-specific shift
  const shift = (parseInt(userData.userHash.slice(-2), 16) % 25) + 1; // 1-25
  const caesarEncrypted = secretMessage
    .split("")
    .map((char) => {
      if (char.match(/[A-Z]/)) {
        return String.fromCharCode(
          ((char.charCodeAt(0) - 65 + shift) % 26) + 65
        );
      }
      return char;
    })
    .join("");

  // XOR encryption with key
  const xorKey = userData.userHash.slice(0, 8);
  const xorEncrypted = secretMessage
    .split("")
    .map((char, i) => {
      const keyChar = xorKey[i % xorKey.length];
      return (char.charCodeAt(0) ^ keyChar.charCodeAt(0))
        .toString(16)
        .padStart(2, "0");
    })
    .join("");

  useEffect(() => {
    if (isActive) {
      // Check if we've already injected for this user to prevent duplicates
      const injectionKey = `securityChallenge_${userData.userHash}_injected`;
      if (window[injectionKey as keyof Window]) {
        return;
      }

      // Mark as injected
      (window as any)[injectionKey] = true;

      // Inject hidden elements and data when step becomes active
      const script = document.createElement("script");
      script.id = `security-script-${userData.userHash}`;
      script.textContent = `
        // Hidden in DevTools Sources
        window.securityChallenge_${userData.userHash} = {
          level: 5,
          encrypted: "${caesarEncrypted}",
          algorithm: "caesar_${shift}",
          verify: function() { 
            console.log("SECURITY_SNIPPET_${userData.userHash}");
            return "verification_complete";
          }
        };
        
        // Hidden in localStorage
        localStorage.setItem('challenge_key_${userData.userHash}', '${xorKey}');
        
        // Single network request with proper tracking
        if (!window.networkRequestSent_${userData.userHash}) {
          window.networkRequestSent_${userData.userHash} = true;
          fetch('/api/challenge/devtools/${userData.userHash}', {
            method: 'GET',
            headers: { 'X-Security-Level': '5' }
          }).catch(() => {}); // Silent fail is intentional
        }
        
        // Delayed console messages (only once)
        if (!window.consoleMessagesSent_${userData.userHash}) {
          window.consoleMessagesSent_${userData.userHash} = true;
          setTimeout(() => {
            console.log('%cSecurity Challenge Step 5', 'color: red; font-weight: bold');
            console.log('Find the Caesar cipher key: shift value is ' + ${shift});
            console.log('XOR key is stored in localStorage with your hash');
            console.log('Execute the verification function to get the snippet');
          }, 1000);
        }
      `;

      // Only append if not already exists
      const existingScript = document.getElementById(
        `security-script-${userData.userHash}`
      );
      if (!existingScript) {
        document.head.appendChild(script);
      }

      return () => {
        // Cleanup function
        try {
          const scriptToRemove = document.getElementById(
            `security-script-${userData.userHash}`
          );
          if (scriptToRemove) {
            document.head.removeChild(scriptToRemove);
          }
          // Reset injection flag on cleanup
          delete (window as any)[injectionKey];
        } catch {
          // Script might already be removed
        }
      };
    }
  }, [isActive, userData.userHash, caesarEncrypted, shift, xorKey]);

  return (
    <Card
      className={`${
        isCompleted
          ? "border-green-500"
          : isActive
          ? "border-blue-500"
          : "border-gray-200"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          )}
          Step 5: Advanced Encryption & DevTools Mastery
          {isCompleted && <Badge variant="secondary">Completed</Badge>}
          {!isActive && !isCompleted && (
            <Lock className="h-4 w-4 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isActive && (
          <>
            <p className="text-gray-700 mb-4">
              Complete the final encryption challenge.
            </p>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-red-900 mb-2">
                ⚠️ Advanced Security Challenge
              </h4>
              <p className="text-red-800 text-sm mb-2">
                This step requires advanced DevTools skills and cryptographic
                knowledge.
              </p>
              <ol className="list-decimal list-inside text-red-800 space-y-1 text-sm">
                <li>Decrypt the Caesar cipher using DevTools console clues</li>
                <li>
                  Find and use the XOR decryption key from browser storage
                </li>
                <li>
                  Generate the correct SHA-256 hash of the decrypted message
                </li>
                <li>
                  Execute the hidden verification function to get the final
                  snippet
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Caesar Cipher:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(caesarEncrypted)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-xs break-all bg-white p-2 rounded border block font-mono">
                  {caesarEncrypted}
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    XOR Encrypted (Hex):
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(xorEncrypted)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-xs break-all bg-white p-2 rounded border block font-mono">
                  {xorEncrypted}
                </code>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={onToggleHint}>
                {showHint ? "Hide Hints" : "Show Hints"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedTools(!showAdvancedTools)}
              >
                {showAdvancedTools ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showAdvancedTools ? "Hide" : "Show"} Advanced Tools
              </Button>
            </div>

            {showHint && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>DevTools Investigation:</strong>
                    </p>
                    <p>
                      • <strong>Console:</strong> Look for red security messages
                      with cipher details
                    </p>
                    <p>
                      • <strong>Application Tab:</strong> Check localStorage for
                      keys with your hash
                    </p>
                    <p>
                      • <strong>Network Tab:</strong> Monitor for
                      security-related requests
                    </p>
                    <p>
                      • <strong>Sources/Debugger:</strong> Find the hidden
                      verification function
                    </p>
                    <p>
                      <strong>Cryptography:</strong>
                    </p>
                    <p>
                      • <strong>Caesar Cipher:</strong> Shift alphabet by the
                      number found in console
                    </p>
                    <p>
                      • <strong>XOR Decryption:</strong> Use the key from
                      localStorage to decrypt hex values
                    </p>
                    <p>
                      • <strong>SHA-256:</strong> Hash the final decrypted
                      message
                    </p>
                    <p className="text-orange-600">
                      <strong>Pro Tip:</strong> Execute
                      `window.securityChallenge_{userData.userHash.slice(0, 8)}
                      ...verify()` in console
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {showAdvancedTools && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  🔧 Advanced Cryptographic Tools
                </h4>
                <div className="text-blue-800 text-sm space-y-2">
                  <p>
                    <strong>Caesar Cipher Decoder (JavaScript):</strong>
                  </p>
                  <code className="block bg-white p-2 rounded text-xs">
                    {`const decode = (text, shift) => text.split('').map(c => c.match(/[A-Z]/) ? String.fromCharCode(((c.charCodeAt(0) - 65 - shift + 26) % 26) + 65) : c).join('');`}
                  </code>
                  <p>
                    <strong>XOR Hex Decoder:</strong>
                  </p>
                  <code className="block bg-white p-2 rounded text-xs">
                    {`const xorDecode = (hex, key) => hex.match(/.{2}/g).map((h, i) => String.fromCharCode(parseInt(h, 16) ^ key[i % key.length].charCodeAt(0))).join('');`}
                  </code>
                  <p>
                    <strong>SHA-256 Generator:</strong>
                  </p>
                  <code className="block bg-white p-2 rounded text-xs">
                    {`crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')));`}
                  </code>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  1. Decrypted Message (from either cipher):
                </label>
                <Input
                  placeholder="MASTER_KEY_[hash]_VERIFIED"
                  value={cipherInput}
                  onChange={(e) => onCipherInputChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Decrypt either the Caesar or XOR cipher to get the secret
                  message.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  2. XOR Decryption Key:
                </label>
                <Input
                  placeholder="Found in localStorage..."
                  value={keyInput}
                  onChange={(e) => onKeyInputChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find the key stored in localStorage with your user hash.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  3. SHA-256 Hash of Decrypted Message:
                </label>
                <Input
                  placeholder="64-character hexadecimal hash..."
                  value={hashInput}
                  onChange={(e) => onHashInputChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generate SHA-256 hash of the decrypted message.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  4. Verification Snippet Output:
                </label>
                <Input
                  placeholder="SECURITY_SNIPPET_[hash]"
                  value={snippetInput}
                  onChange={(e) => onSnippetInputChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Execute the hidden verification function to get this output.
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="whitespace-pre-line">{error}</div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={onSubmit}
              disabled={
                loading ||
                !cipherInput.trim() ||
                !keyInput.trim() ||
                !hashInput.trim() ||
                !snippetInput.trim()
              }
              className="mt-4"
            >
              {loading
                ? "Validating..."
                : "Complete Advanced Security Challenge"}
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="text-green-600">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-center">
                <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  🏆 Intro to Encryption and Devtools Completed!
                </h3>
                <p className="text-green-700 mb-4">
                  You've mastered cryptography and DevTools!
                </p>
                <div className="bg-white border border-green-300 rounded p-4">
                  <p className="font-medium text-green-800">
                    Your Encryption and Devtools number:
                  </p>
                  <code className="text-lg font-mono text-green-900 break-all">
                    SECURITY_EXPERT_{userData.userHash}
                  </code>
                </div>
                <p className="text-sm text-green-600 mt-4">
                  You've mastered JWT analysis, repository investigation,
                  DevTools forensics, API security testing, and advanced
                  cryptographic techniques!
                </p>
              </div>
            </div>
          </div>
        )}

        {!isActive && !isCompleted && (
          <p className="text-gray-500">
            Complete previous steps to unlock the advanced security challenge.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
