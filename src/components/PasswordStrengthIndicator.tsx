import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export const getPasswordRequirements = (password: string): PasswordRequirements => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[!@#$%&^*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
});

export const isPasswordStrong = (password: string): boolean => {
  const req = getPasswordRequirements(password);
  return req.minLength && req.hasUppercase && req.hasLowercase && req.hasNumber && req.hasSpecial;
};

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = useMemo(() => getPasswordRequirements(password), [password]);

  const metCount = Object.values(requirements).filter(Boolean).length;

  const strength = useMemo(() => {
    if (password.length === 0) return null;
    if (metCount <= 2) return { label: "Weak", color: "text-red-500", bg: "bg-red-500", width: "25%" };
    if (metCount === 3) return { label: "Fair", color: "text-orange-500", bg: "bg-orange-500", width: "50%" };
    if (metCount === 4) return { label: "Good", color: "text-yellow-500", bg: "bg-yellow-500", width: "75%" };
    return { label: "Strong", color: "text-green-500", bg: "bg-green-500", width: "100%" };
  }, [metCount, password.length]);

  if (password.length === 0) return null;

  const rules = [
    { key: "minLength", label: "At least 8 characters", met: requirements.minLength },
    { key: "hasUppercase", label: "One uppercase letter", met: requirements.hasUppercase },
    { key: "hasLowercase", label: "One lowercase letter", met: requirements.hasLowercase },
    { key: "hasNumber", label: "One number", met: requirements.hasNumber },
    { key: "hasSpecial", label: "One special character (!@#$%&)", met: requirements.hasSpecial },
  ];

  return (
    <div className="space-y-2 mt-1">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${strength?.bg} rounded-full transition-all duration-300`}
            style={{ width: strength?.width }}
          />
        </div>
        <span className={`text-xs font-semibold ${strength?.color}`}>{strength?.label}</span>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-0.5">
        {rules.map((rule) => (
          <li key={rule.key} className="flex items-center gap-1.5 text-xs">
            {rule.met ? (
              <Check className="w-3 h-3 text-green-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span className={rule.met ? "text-green-500" : "text-muted-foreground"}>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
