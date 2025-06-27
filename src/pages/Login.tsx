import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, KeyRound, Mail, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { teacherLogin, teacherSignup } = useAuth();
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const navigate = useNavigate();
  
  // Teacher auth states
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [teacherName, setTeacherName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole === "student") {
      // Redirect to student join page
      navigate("/join");
    } else {
      // Show teacher authentication form
      setShowTeacherAuth(true);
    }
  };
  
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await teacherLogin(email, password);
      if (!success) {
        console.log("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTeacherSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacherName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await teacherSignup(teacherName, email, password);
      if (!success) {
        console.log("Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showTeacherAuth) {
    return (
      <div className="min-h-screen quiz-pattern flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-2 border-quiz-primary/20 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight text-center">
                <span className="text-quiz-primary">Class</span>
                <span className="text-quiz-secondary">Node</span>
              </CardTitle>
              <CardDescription className="text-center">
                Teacher Portal - Sign in or create an account Updated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as "login" | "signup")}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleTeacherLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="teacher@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full quiz-gradient" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleTeacherSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacherName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="teacherName"
                          placeholder="John Doe"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="teacher@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupPassword"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-9"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full quiz-gradient"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => setShowTeacherAuth(false)}
                size="sm"
                disabled={isLoading}
              >
                Back to Main Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen quiz-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-quiz-primary/20 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-center">
              <span className="text-quiz-primary">Class</span>
              <span className="text-quiz-secondary">Node</span>
            </CardTitle>
            <CardDescription className="text-center">
              Welcome to ClassNode - Select your role to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRoleSelection} className="space-y-4">
             
              
              <div className="space-y-2">
                <Label>I am a:</Label>
                <RadioGroup 
                  value={selectedRole} 
                  onValueChange={(value) => setSelectedRole(value as "student" | "teacher")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="teacher" />
                    <Label htmlFor="teacher">Teacher</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full quiz-gradient">
                Continue
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            {selectedRole === "student" ? (
              <p>made with &#9829; by team ClassNode</p>
            ) : (
              <p>made with &#9829; by team ClassNode</p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
