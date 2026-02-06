import { maskEmail, createDuplicateAccountMessage } from './email-mask.util';

describe('Email Masking Utility', () => {
  describe('maskEmail', () => {
    it('should mask a standard email address keeping full domain', () => {
      expect(maskEmail('john.doe@example.com')).toBe('joh*****@example.com');
    });

    it('should mask Gmail addresses correctly with full domain visible', () => {
      expect(maskEmail('b.alencar.amaral@gmail.com')).toBe(
        'b.a**************@gmail.com',
      );
    });

    it('should keep Yahoo domain fully visible', () => {
      expect(maskEmail('user.name@yahoo.com')).toBe('use*****@yahoo.com');
    });

    it('should keep Outlook domain fully visible', () => {
      expect(maskEmail('test@outlook.com')).toBe('tes*@outlook.com');
    });

    it('should handle short local parts', () => {
      expect(maskEmail('ab@example.com')).toBe('ab@example.com');
      expect(maskEmail('abc@example.com')).toBe('abc@example.com');
    });

    it('should keep full domain for short domains', () => {
      expect(maskEmail('user@ab.com')).toBe('use*@ab.com');
      expect(maskEmail('user@xyz.org')).toBe('use*@xyz.org');
    });

    it('should handle emails with subdomains keeping full domain', () => {
      expect(maskEmail('test@mail.example.com')).toBe('tes*@mail.example.com');
    });

    it('should handle emails with multiple TLD parts keeping full domain', () => {
      expect(maskEmail('user@example.co.uk')).toBe('use*@example.co.uk');
    });

    it('should handle very short emails', () => {
      expect(maskEmail('a@b.co')).toBe('a@b.co');
    });

    it('should handle emails with plus addressing', () => {
      expect(maskEmail('user+tag@example.com')).toBe('use*****@example.com');
    });

    it('should return invalid emails as-is', () => {
      expect(maskEmail('notanemail')).toBe('notanemail');
      expect(maskEmail('')).toBe('');
      expect(maskEmail('user@')).toBe('user@');
    });
  });

  describe('createDuplicateAccountMessage', () => {
    describe('email duplicate type', () => {
      it('should create message for duplicate email with full domain', () => {
        const result = createDuplicateAccountMessage(
          'john.doe@example.com',
          'email',
        );

        expect(result.maskedEmail).toBe('joh*****@example.com');
        expect(result.message).toBe(
          'An account with this email address already exists.',
        );
        expect(result.suggestion).toContain('joh*****@example.com');
        expect(result.suggestion).toContain('try logging in');
        expect(result.suggestion).toContain('password recovery');
        expect(result.suggestion).toContain('contact support');
      });
    });

    describe('person duplicate type', () => {
      it('should create message for duplicate person with full domain', () => {
        const result = createDuplicateAccountMessage(
          'jane.smith@example.com',
          'person',
        );

        expect(result.maskedEmail).toBe('jan*******@example.com');
        expect(result.message).toBe(
          'An account with the same name and date of birth already exists.',
        );
        expect(result.suggestion).toContain('jan*******@example.com');
        expect(result.suggestion).toContain('try logging in');
        expect(result.suggestion).toContain('password recovery');
        expect(result.suggestion).toContain('contact support');
      });
    });

    it('should handle Gmail addresses in messages showing gmail.com', () => {
      const result = createDuplicateAccountMessage(
        'b.alencar.amaral@gmail.com',
        'person',
      );

      expect(result.maskedEmail).toBe('b.a**************@gmail.com');
      expect(result.suggestion).toContain('b.a**************@gmail.com');
    });
  });
});
