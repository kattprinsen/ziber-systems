import { SalaryCalculator } from '../../components/tools/SalaryCalculator';

export const ToolsPage = () => {
    return (
        <div className="text-text-primary">
            <h1 className="text-3xl font-bold mb-4">Tools</h1>
            <p className="text-text-secondary mb-6">Salary calculation and planning tools.</p>
            
            <SalaryCalculator />
        </div>
    )
}