import { calculatePasswordStrength } from '../utils/passwordGenerator';

const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">
          Strength:
        </span>
        <span className={`text-xs font-semibold ${
          passwordStrength.color === 'red' ? 'text-destructive' :
          passwordStrength.color === 'orange' ? 'text-orange-600' :
          passwordStrength.color === 'yellow' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {passwordStrength.label}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            passwordStrength.color === 'red' ? 'bg-destructive' :
            passwordStrength.color === 'orange' ? 'bg-orange-500' :
            passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
