"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getDecryptedApiKey, setEncryptedApiKey, hasApiKey, removeApiKey } from '@/lib/encryption';
// import { AISetupManager, UserAIConfig, getAvailableServices, hasAIServices } from '@/lib/aiAuth';

interface AISettingsProps {
  onClose: () => void;
}

export default function AISettings({ onClose }: AISettingsProps) {
  const [aiConfig, setAiConfig] = useState({
    openai: { isConnected: false, lastUsed: null },
    gemini: { isConnected: false, lastUsed: null },
    textcortex: { isConnected: false, lastUsed: null }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState({
    openai: '',
    gemini: '',
    textcortex: ''
  });
  const [showKeyInput, setShowKeyInput] = useState<string | null>(null);

  useEffect(() => {
    loadAIConfig();
  }, []);

  const loadAIConfig = async () => {
    try {
      // Check for encrypted API keys
      const openaiKey = hasApiKey('openai');
      const geminiKey = hasApiKey('gemini');
      const textcortexKey = hasApiKey('textcortex');
      
      const config = {
        openai: { 
          isConnected: openaiKey, 
          lastUsed: openaiKey ? new Date().toISOString() : null 
        },
        gemini: { 
          isConnected: geminiKey, 
          lastUsed: geminiKey ? new Date().toISOString() : null 
        },
        textcortex: { 
          isConnected: textcortexKey, 
          lastUsed: textcortexKey ? new Date().toISOString() : null 
        }
      };
      
      setAiConfig(config);
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  const connectService = async (provider: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const apiKey = apiKeyInputs[provider as keyof typeof apiKeyInputs];
      
      if (!apiKey) {
        setMessage({ type: 'error', text: 'API key is required' });
        setLoading(false);
        return;
      }
      
      // Test the connection
      const response = await fetch('/api/user/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Store the encrypted API key
        setEncryptedApiKey(provider, apiKey);
        setApiKeyInputs(prev => ({ ...prev, [provider]: '' }));
        setShowKeyInput(null);
        await loadAIConfig();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to connect service' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect service' });
    } finally {
      setLoading(false);
    }
  };

  const disconnectService = async (provider: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/ai-config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Remove the encrypted API key
        removeApiKey(provider);
        await loadAIConfig();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to disconnect service' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect service' });
    } finally {
      setLoading(false);
    }
  };

  const services = [
           {
             id: 'openai',
             name: 'OpenAI',
             description: 'GPT-4, GPT-3.5 for advanced AI suggestions',
             icon: (
               <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white">
                 <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
               </svg>
             ),
             color: 'from-green-500 to-emerald-600',
             borderColor: 'border-green-400',
             connected: aiConfig.openai?.isConnected || false
           },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Google\'s AI for diverse suggestions',
      icon: (
        <svg viewBox="0 0 16 16" className="w-12 h-12 fill-current text-white">
          <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)"/>
          <defs>
            <radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)">
              <stop offset=".067" stopColor="#9168C0"/>
              <stop offset=".343" stopColor="#5684D1"/>
              <stop offset=".672" stopColor="#1BA1E3"/>
            </radialGradient>
          </defs>
        </svg>
      ),
      color: 'from-blue-500 to-cyan-600',
      borderColor: 'border-blue-400',
      connected: aiConfig.gemini?.isConnected || false
    },
           {
             id: 'textcortex',
             name: 'TextCortex',
             description: 'Alternative AI for content generation',
             icon: (
               <svg viewBox="0 0 2000 2000" className="w-12 h-12 fill-current text-white">
                 <defs>
                   <linearGradient id="paint0_linear_461_719" x1="350.014" y1="470.01" x2="1388.96" y2="1743.1" gradientUnits="userSpaceOnUse">
                     <stop stopColor="#FF805F"/>
                     <stop offset="0.5" stopColor="#B74BDD"/>
                     <stop offset="1" stopColor="#0379FF"/>
                   </linearGradient>
                 </defs>
                 <path fillRule="evenodd" clipRule="evenodd" d="M1308.48 1291.92C1308.53 1291.99 1308.58 1292.05 1308.62 1292.13L1308.84 1292.36C1308.72 1292.22 1308.6 1292.07 1308.48 1291.92ZM1150.88 1099.73L1150.87 1099.74L1030.02 1207.98L1030.08 1208.05H1030.02V1377.97C1030.02 1462.21 1098.3 1530.49 1182.54 1530.49C1266.26 1530.49 1334.23 1463.04 1335.05 1379.51C1349.42 1383.99 1364.7 1386.41 1380.54 1386.41C1464.77 1386.41 1533.06 1318.13 1533.06 1233.89C1533.06 1203.86 1524.38 1175.87 1509.4 1152.27C1587.82 1145.95 1649.49 1080.31 1649.49 1000.25C1649.49 920.26 1587.91 854.652 1509.58 848.24C1524.45 824.7 1533.06 796.801 1533.06 766.89C1533.06 682.661 1464.77 614.371 1380.54 614.371C1364.7 614.371 1349.42 616.79 1335.05 621.271C1334.38 537.621 1266.35 470.01 1182.54 470.01C1098.3 470.01 1030.02 538.3 1030.02 622.531V792.309L1030.18 792.45L1150.87 900.549L1150.88 900.561L1150.88 1099.73ZM1275.06 622.531C1275.06 640.309 1270.04 656.92 1261.34 671.02L1234.94 698.781L1202.92 732.451H1090.02V622.531C1090.02 571.44 1131.44 530.011 1182.54 530.011C1233.63 530.011 1275.06 571.44 1275.06 622.531ZM1210.88 1092.77V907.732H1496.97C1548.06 907.732 1589.49 949.16 1589.49 1000.25C1589.49 1051.35 1548.06 1092.77 1496.97 1092.77H1210.88ZM1090.02 1268.05H1202.91L1234.96 1301.73L1261.33 1329.46C1270.04 1343.56 1275.06 1360.18 1275.06 1377.97C1275.06 1429.07 1233.63 1470.49 1182.54 1470.49C1131.43 1470.49 1090.02 1429.07 1090.02 1377.97L1090.02 1268.05ZM1181.6 1152.77H1425.05C1453.66 1168.5 1473.06 1198.93 1473.06 1233.89C1473.06 1284.99 1431.63 1326.41 1380.54 1326.41C1356.71 1326.41 1334.99 1317.4 1318.59 1302.6L1318.55 1302.56C1315.07 1299.43 1311.82 1296.02 1308.86 1292.38L1308.84 1292.36L1308.62 1292.13L1274.61 1256.37L1230.2 1209.67L1229.97 1209.43L1228.66 1208.05H1119.87L1181.6 1152.77ZM1120.11 792.45H1228.66L1229.93 791.111L1230.2 790.832L1274.59 744.141L1308.65 708.332L1311.06 705.802L1311.08 705.781C1312.63 704.021 1314.25 702.311 1315.93 700.691V700.681C1332.6 684.402 1355.4 674.372 1380.54 674.372C1431.63 674.372 1473.06 715.8 1473.06 766.891C1473.06 801.653 1453.89 831.931 1425.55 847.731H1181.83L1120.11 792.45ZM1030.18 792.45H1030.02L1030.02 792.309L1030.18 792.45ZM1030.18 792.45H1030.02L1030.02 792.309L1030.18 792.45ZM1315.93 700.691L1311.08 705.781C1312.63 704.022 1314.25 702.312 1315.93 700.691ZM1318.55 1302.56C1315.07 1299.43 1311.82 1296.02 1308.86 1292.38L1318.55 1302.56ZM1150.88 900.561L1150.88 907.732H1150.87V900.548L1150.88 900.561ZM1150.88 1092.77V1099.73L1150.87 1099.74V1092.77H1150.88ZM690.665 1292.36L690.885 1292.13C690.926 1292.05 690.974 1291.99 691.026 1291.92C690.904 1292.07 690.785 1292.22 690.665 1292.36ZM848.625 900.561L848.635 900.549L969.324 792.45L969.486 792.309V622.531C969.486 538.3 901.205 470.01 816.965 470.01C733.155 470.01 665.123 537.62 664.453 621.271C650.083 616.791 634.803 614.371 618.965 614.371C534.734 614.371 466.444 682.661 466.444 766.89C466.444 796.801 475.055 824.7 489.925 848.24C411.594 854.652 350.014 920.26 350.014 1000.25C350.014 1080.31 411.683 1145.95 490.102 1152.27C475.123 1175.87 466.443 1203.86 466.443 1233.89C466.443 1318.13 534.733 1386.41 618.964 1386.41C634.802 1386.41 650.083 1383.99 664.452 1379.51C665.275 1463.04 733.244 1530.49 816.964 1530.49C901.203 1530.49 969.485 1462.21 969.485 1377.97V1208.05H969.424L969.485 1207.98L848.634 1099.74L848.624 1099.73L848.625 900.561ZM816.965 530.011C868.065 530.011 909.484 571.44 909.484 622.531V732.451H796.584L764.563 698.781L738.163 671.02C729.464 656.919 724.446 640.309 724.446 622.531C724.446 571.44 765.876 530.011 816.965 530.011ZM502.535 1092.77C451.446 1092.77 410.014 1051.35 410.014 1000.25C410.014 949.16 451.445 907.732 502.535 907.732H788.626V1092.77H502.535ZM909.484 1377.97C909.484 1429.07 868.065 1470.49 816.965 1470.49C765.876 1470.49 724.446 1429.07 724.446 1377.97C724.446 1360.18 729.464 1343.56 738.175 1329.46L764.545 1301.73L796.585 1268.05H909.484V1377.97ZM879.636 1208.05H770.845L769.535 1209.43L769.306 1209.67L724.895 1256.37L690.885 1292.13L690.665 1292.36L690.646 1292.38C687.686 1296.02 684.435 1299.43 680.955 1302.56L680.915 1302.6C664.515 1317.4 642.795 1326.41 618.965 1326.41C567.874 1326.41 526.444 1284.99 526.444 1233.89C526.444 1198.93 545.845 1168.5 574.455 1152.77H817.905L879.636 1208.05ZM817.675 847.73H573.955C545.617 831.93 526.445 801.651 526.445 766.89C526.445 715.799 567.875 674.371 618.966 674.371C644.106 674.371 666.906 684.401 683.576 700.68V700.69C685.257 702.31 686.875 704.02 688.425 705.78L688.446 705.801L690.855 708.331L724.906 744.14L769.307 790.831L769.566 791.11L770.847 792.449H879.397L817.675 847.73ZM969.486 792.309V792.45H969.324L969.486 792.309ZM969.486 792.309V792.45H969.324L969.486 792.309ZM688.425 705.78L683.576 700.69C685.257 702.311 686.876 704.021 688.425 705.78ZM690.646 1292.38C687.686 1296.02 684.435 1299.43 680.955 1302.56L690.646 1292.38ZM848.635 900.548V907.732H848.625V900.561L848.635 900.548ZM848.635 1092.77V1099.74L848.624 1099.73L848.625 1092.77H848.635Z" fill="url(#paint0_linear_461_719)"/>
               </svg>
             ),
             color: 'from-purple-500 to-violet-600',
             borderColor: 'border-purple-400',
             connected: aiConfig.textcortex?.isConnected || false
           }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="text-3xl mr-3">🤖</span>
            AI Services
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-300 text-lg">
            Connect your AI accounts to get personalized suggestions and recommendations.
            Your API keys are encrypted and stored securely.
          </p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-400/50 text-green-200' 
                : 'bg-red-500/20 border border-red-400/50 text-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-4">
          {services.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-r ${service.color} p-4 rounded-xl border ${service.borderColor} shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{service.name}</h3>
                    <p className="text-white/80 text-sm">{service.description}</p>
                    {service.connected && (
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-green-200 text-xs">Connected</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {service.connected ? (
                    <Button
                      onClick={() => disconnectService(service.id)}
                      disabled={loading}
                      variant="outline"
                      className="bg-red-500/20 border-red-400 text-red-200 hover:bg-red-500/30"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowKeyInput(service.id)}
                      disabled={loading}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              
              {/* API Key Input Form */}
              {showKeyInput === service.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-black/20 rounded-lg border border-white/20"
                >
                  <div className="space-y-3">
                    <label className="block text-white/90 text-sm font-medium">
                      Enter your {service.name} API Key:
                    </label>
                    <input
                      type="password"
                      value={apiKeyInputs[service.id as keyof typeof apiKeyInputs]}
                      onChange={(e) => setApiKeyInputs(prev => ({ 
                        ...prev, 
                        [service.id]: e.target.value 
                      }))}
                      placeholder={`Enter your ${service.name} API key...`}
                      className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => connectService(service.id)}
                        disabled={loading || !apiKeyInputs[service.id as keyof typeof apiKeyInputs]}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        {loading ? 'Connecting...' : 'Connect'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowKeyInput(null);
                          setApiKeyInputs(prev => ({ ...prev, [service.id]: '' }));
                        }}
                        variant="outline"
                        className="bg-gray-500/20 border-gray-400 text-gray-200 hover:bg-gray-500/30"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
          <h4 className="text-white font-bold mb-2 flex items-center">
            <span className="text-xl mr-2">🔒</span>
            Security & Privacy
          </h4>
          <ul className="text-slate-300 text-sm space-y-1">
            <li>• API keys are encrypted before storage</li>
            <li>• Keys are never exposed to client-side code</li>
            <li>• You can disconnect services at any time</li>
            <li>• Usage is tracked for your reference</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-600/30">
          <h4 className="text-blue-200 font-bold mb-2 flex items-center">
            <span className="text-xl mr-2">💡</span>
            How to Get API Keys
          </h4>
          <div className="text-blue-100 text-sm space-y-2">
            <div>
              <strong>OpenAI:</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">platform.openai.com/api-keys</a> to create your API key
            </div>
            <div>
              <strong>Google Gemini:</strong> Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">makersuite.google.com/app/apikey</a> to create your API key
            </div>
            <div>
              <strong>TextCortex:</strong> Visit <a href="https://app.textcortex.com/user/api" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">app.textcortex.com/user/api</a> to create your API key
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
